import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { readLimitedJson } from '@/lib/security/json'
import {
  createSubmissionCompletionToken,
  fingerprintSubmissionPayload,
  getSubmissionRateLimitConfig,
  hashClientIp,
  hashIdempotencyKey,
  SecurityConfigurationError,
} from '@/lib/security/request'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { SupabaseConfigurationError } from '@/lib/supabase/config'
import {
  extensionForMimeType,
  idempotencyKeySchema,
  MAX_SUBMISSION_JSON_BYTES,
  sanitizeOriginalFilename,
  SUBMISSION_BUCKET,
  submissionInitSchema,
} from '@/lib/validation/submission'
import type { Json } from '@/types/database'
import type {
  ApiErrorCode,
  ApiErrorResponse,
  SubmissionInitResponse,
} from '@/types/submission'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
}
const CAPACITY_RETRY_AFTER_SECONDS = 24 * 60 * 60

function errorResponse(
  code: ApiErrorCode,
  status: number,
  error = 'მოთხოვნის დამუშავება ვერ მოხერხდა. სცადეთ თავიდან.',
  headers?: HeadersInit,
) {
  return NextResponse.json<ApiErrorResponse>(
    { code, error },
    {
      status,
      headers: { ...NO_STORE_HEADERS, ...headers },
    },
  )
}

export async function POST(request: Request) {
  const idempotencyResult = idempotencyKeySchema.safeParse(
    request.headers.get('idempotency-key'),
  )
  if (!idempotencyResult.success) {
    return errorResponse('IDEMPOTENCY_REQUIRED', 400)
  }

  let rawBody: unknown
  try {
    rawBody = await readLimitedJson(request, MAX_SUBMISSION_JSON_BYTES)
  } catch {
    return errorResponse('INVALID_REQUEST', 400)
  }

  const bodyResult = submissionInitSchema.safeParse(rawBody)
  if (!bodyResult.success || bodyResult.data.website.trim().length > 0) {
    return errorResponse('INVALID_REQUEST', 400)
  }

  const input = bodyResult.data
  const proposedSubmissionId = randomUUID()
  const pendingFiles = input.files.map((file) => {
    const extension = extensionForMimeType(file.mimeType)
    return {
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      originalFilename: sanitizeOriginalFilename(file.originalFilename),
      sortOrder: file.sortOrder,
      storagePath: `submissions/${proposedSubmissionId}/${randomUUID()}.${extension}`,
    }
  })

  try {
    const service = getServiceSupabaseClient()
    const rateLimit = getSubmissionRateLimitConfig()
    const idempotencyKeyHash = hashIdempotencyKey(idempotencyResult.data)
    const requestFingerprint = fingerprintSubmissionPayload({
      additionalInfo: input.additionalInfo ?? null,
      consentGiven: input.consentGiven,
      customerName: input.customerName ?? null,
      engine: input.engine ?? null,
      files: input.files.map((file) => ({
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        originalFilename: sanitizeOriginalFilename(file.originalFilename),
        sortOrder: file.sortOrder,
      })),
      location: input.location ?? null,
      mileage: input.mileage ?? null,
      phone: input.phone,
      price: input.price,
      priceCurrency: input.priceCurrency,
      transmission: input.transmission ?? null,
      vehicleModel: input.vehicleModel,
      vehicleYear: input.vehicleYear,
    })

    const { data: beginRows, error: beginError } = await service.rpc(
      'begin_submission',
      {
        p_additional_info: input.additionalInfo ?? null,
        p_consent_given: input.consentGiven,
        p_customer_name: input.customerName ?? null,
        p_engine: input.engine ?? null,
        p_files: pendingFiles as Json,
        p_idempotency_key_hash: idempotencyKeyHash,
        p_ip_hash: hashClientIp(request),
        p_location: input.location ?? null,
        p_mileage: input.mileage ?? null,
        p_phone: input.phone,
        p_price: input.price,
        p_price_currency: input.priceCurrency,
        p_rate_limit: rateLimit.limit,
        p_request_rate_limit: rateLimit.requestLimit,
        p_request_fingerprint: requestFingerprint,
        p_submission_id: proposedSubmissionId,
        p_transmission: input.transmission ?? null,
        p_vehicle_model: input.vehicleModel,
        p_vehicle_year: input.vehicleYear,
        p_window_seconds: rateLimit.windowSeconds,
      },
    )

    if (beginError) {
      if (beginError.message.includes('intake_capacity_exceeded')) {
        return errorResponse('RATE_LIMITED', 429, undefined, {
          'Retry-After': String(CAPACITY_RETRY_AFTER_SECONDS),
        })
      }

      if (beginError.message.includes('idempotency_conflict')) {
        return errorResponse('IDEMPOTENCY_CONFLICT', 409)
      }

      console.error('[submissions/init] begin_submission failed', {
        code: beginError.code,
      })
      return errorResponse('SERVICE_UNAVAILABLE', 503)
    }

    const begun = beginRows?.[0]
    if (!begun) return errorResponse('SERVICE_UNAVAILABLE', 503)

    if (begun.idempotency_conflict) {
      return errorResponse('IDEMPOTENCY_CONFLICT', 409)
    }

    if (begun.rate_limited) {
      const retryAfter = Math.max(1, begun.retry_after_seconds)
      return errorResponse('RATE_LIMITED', 429, undefined, {
        'Retry-After': String(retryAfter),
      })
    }

    if (!begun.submission_id || !begun.public_reference) {
      return errorResponse('SERVICE_UNAVAILABLE', 503)
    }

    const { data: fileRows, error: filesError } = await service
      .from('submission_files')
      .select('sort_order, storage_path')
      .eq('submission_id', begun.submission_id)
      .order('sort_order', { ascending: true })

    if (filesError || fileRows.length !== input.files.length) {
      console.error('[submissions/init] expected file lookup failed', {
        code: filesError?.code,
      })
      return errorResponse('SERVICE_UNAVAILABLE', 503)
    }

    const signedUploads = await Promise.all(
      fileRows.map(async (file) => {
        const { data, error } = await service.storage
          .from(SUBMISSION_BUCKET)
          .createSignedUploadUrl(file.storage_path)

        if (error || !data?.token) {
          throw new Error('signed_upload_failed')
        }

        return {
          fileIndex: file.sort_order,
          path: file.storage_path,
          token: data.token,
        }
      }),
    )

    const response: SubmissionInitResponse = {
      submissionId: begun.submission_id,
      publicReference: begun.public_reference,
      completionToken: createSubmissionCompletionToken(begun.submission_id),
      uploads: signedUploads,
    }

    return NextResponse.json(response, {
      status: begun.was_existing ? 200 : 201,
      headers: NO_STORE_HEADERS,
    })
  } catch (error) {
    console.error('[submissions/init] unavailable', {
      ...(process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: error.message }
        : {}),
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    if (
      process.env.NODE_ENV === 'development' &&
      (error instanceof SupabaseConfigurationError ||
        error instanceof SecurityConfigurationError)
    ) {
      return errorResponse(
        'CONFIGURATION_ERROR',
        503,
        `განვითარების კონფიგურაცია არასრულია. შეამოწმე .env.local: ${error.message}`,
      )
    }

    return errorResponse('SERVICE_UNAVAILABLE', 503)
  }
}
