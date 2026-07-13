import { NextResponse } from 'next/server'
import { start } from 'workflow/api'

import { getResultUrl } from '@/lib/fulfillment/result-token'
import { readLimitedJson } from '@/lib/security/json'
import {
  SecurityConfigurationError,
  verifySubmissionCompletionToken,
} from '@/lib/security/request'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { SupabaseConfigurationError } from '@/lib/supabase/config'
import {
  IMAGE_VALIDATION_PREFIX_BYTES,
  validateImageContent,
} from '@/lib/validation/image-content'
import {
  MAX_SUBMISSION_JSON_BYTES,
  SUBMISSION_BUCKET,
  submissionCompleteSchema,
} from '@/lib/validation/submission'
import type { Json } from '@/types/database'
import type {
  ApiErrorCode,
  ApiErrorResponse,
  SubmissionCompleteResponse,
} from '@/types/submission'
import { previewFulfillmentWorkflow } from '@/workflows/fulfillment'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
}

const SIGNED_DOWNLOAD_TTL_SECONDS = 30
const STORAGE_READ_TIMEOUT_MS = 8_000

async function ensureAutomationStarted(
  submissionId: string,
  service: ReturnType<typeof getServiceSupabaseClient>,
) {
  const { data: queueRows, error: queueError } = await service.rpc(
    'queue_fulfillment',
    { p_submission_id: submissionId },
  )
  const queued = queueRows?.[0]
  if (queueError || !queued) throw new Error('fulfillment_queue_failed')

  if (queued.should_start_preview && queued.preview_start_token) {
    try {
      const run = await start(previewFulfillmentWorkflow, [submissionId])
      const { error: runError } = await service
        .from('fulfillments')
        .update({ preview_workflow_run_id: run.runId })
        .eq('submission_id', submissionId)
        .eq('preview_workflow_run_id', queued.preview_start_token)
      if (runError) throw new Error('fulfillment_run_record_failed')
    } catch (error) {
      await service
        .from('fulfillments')
        .update({
          failed_at: new Date().toISOString(),
          last_error_code: 'workflow_start_failed',
          preview_workflow_run_id: null,
          status: 'failed',
        })
        .eq('submission_id', submissionId)
        .eq('preview_workflow_run_id', queued.preview_start_token)
      throw error
    }
  }

  return queued.fulfillment_status
}

function errorResponse(
  code: ApiErrorCode,
  status: number,
  error = 'ატვირთვა სრულად ვერ დადასტურდა. გადაამოწმეთ ფოტოები და სცადეთ თავიდან.',
) {
  return NextResponse.json<ApiErrorResponse>(
    { code, error },
    { status, headers: NO_STORE_HEADERS },
  )
}

function normalizeContentType(contentType: string | undefined) {
  return contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? null
}

async function readBoundedPrefix(url: string) {
  const abortController = new AbortController()
  const timeout = setTimeout(
    () => abortController.abort(),
    STORAGE_READ_TIMEOUT_MS,
  )

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Range: `bytes=0-${IMAGE_VALIDATION_PREFIX_BYTES - 1}`,
      },
      signal: abortController.signal,
    })
    if (!response.ok || !response.body) {
      throw new Error('upload_verification_failed')
    }

    const prefix = new Uint8Array(IMAGE_VALIDATION_PREFIX_BYTES)
    const reader = response.body.getReader()
    let byteCount = 0
    let streamEnded = false

    try {
      while (byteCount < IMAGE_VALIDATION_PREFIX_BYTES) {
        const { done, value } = await reader.read()
        if (done) {
          streamEnded = true
          break
        }
        if (!value || value.length === 0) continue

        const remaining = IMAGE_VALIDATION_PREFIX_BYTES - byteCount
        const bytesToCopy = Math.min(value.length, remaining)
        prefix.set(value.subarray(0, bytesToCopy), byteCount)
        byteCount += bytesToCopy
      }
    } finally {
      if (!streamEnded) {
        await reader.cancel().catch(() => undefined)
      }
      reader.releaseLock()
    }

    if (byteCount === 0) throw new Error('upload_verification_failed')
    return prefix.slice(0, byteCount)
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await readLimitedJson(request, MAX_SUBMISSION_JSON_BYTES)
  } catch {
    return errorResponse('INVALID_REQUEST', 400)
  }

  const bodyResult = submissionCompleteSchema.safeParse(rawBody)
  if (!bodyResult.success) return errorResponse('INVALID_REQUEST', 400)

  const input = bodyResult.data

  try {
    if (
      !verifySubmissionCompletionToken(
        input.submissionId,
        input.completionToken,
      )
    ) {
      return errorResponse('INVALID_REQUEST', 400)
    }

    const service = getServiceSupabaseClient()
    const [
      { data: submission, error: submissionError },
      { data: files, error: filesError },
    ] = await Promise.all([
      service
        .from('submissions')
        .select(
          'id, public_reference, vehicle_model, upload_state, completed_at, expected_file_count',
        )
        .eq('id', input.submissionId)
        .maybeSingle(),
      service
        .from('submission_files')
        .select('file_size, mime_type, sort_order, storage_path')
        .eq('submission_id', input.submissionId)
        .eq('file_type', 'source_photo')
        .order('sort_order', { ascending: true }),
    ])

    if (
      submissionError ||
      filesError ||
      !submission ||
      files.length !== submission.expected_file_count ||
      input.uploaded.length !== files.length
    ) {
      return errorResponse('UPLOAD_INCOMPLETE', 409)
    }

    const uploadedByIndex = new Map(
      input.uploaded.map((uploaded) => [uploaded.fileIndex, uploaded.path]),
    )
    if (
      files.some(
        (file) => uploadedByIndex.get(file.sort_order) !== file.storage_path,
      )
    ) {
      return errorResponse('UPLOAD_INCOMPLETE', 409)
    }

    if (submission.upload_state === 'complete') {
      const generationStatus = await ensureAutomationStarted(
        submission.id,
        service,
      )
      const response: SubmissionCompleteResponse = {
        submissionId: submission.id,
        publicReference: submission.public_reference,
        vehicleModel: submission.vehicle_model,
        photoCount: files.length,
        resultUrl: getResultUrl(submission.id).toString(),
        generationStatus:
          generationStatus === 'ready'
            ? 'ready'
            : generationStatus === 'preview_ready'
              ? 'preview_ready'
              : 'generating_preview',
      }
      return NextResponse.json(response, { headers: NO_STORE_HEADERS })
    }

    if (submission.upload_state !== 'pending') {
      return errorResponse('UPLOAD_INCOMPLETE', 409)
    }

    const verifiedFiles = await Promise.all(
      files.map(async (file) => {
        const { data, error } = await service.storage
          .from(SUBMISSION_BUCKET)
          .info(file.storage_path)

        const contentType = normalizeContentType(data?.contentType)
        if (
          error ||
          !data ||
          data.size !== file.file_size ||
          contentType !== file.mime_type
        ) {
          throw new Error('upload_verification_failed')
        }

        const { data: signedDownload, error: signedDownloadError } =
          await service.storage
            .from(SUBMISSION_BUCKET)
            .createSignedUrl(file.storage_path, SIGNED_DOWNLOAD_TTL_SECONDS)
        if (signedDownloadError || !signedDownload?.signedUrl) {
          throw new Error('upload_verification_failed')
        }

        const prefix = await readBoundedPrefix(signedDownload.signedUrl)
        const contentValidation = validateImageContent({
          bytes: prefix,
          declaredMimeType: file.mime_type,
          totalSize: data.size,
        })
        if (!contentValidation.valid) {
          throw new Error('upload_verification_failed')
        }

        return {
          path: file.storage_path,
          fileSize: data.size,
          mimeType: contentType,
        }
      }),
    )

    const { data: completedRows, error: completeError } = await service.rpc(
      'complete_submission',
      {
        p_submission_id: submission.id,
        p_uploaded_files: verifiedFiles as Json,
      },
    )

    if (completeError || !completedRows?.[0]) {
      console.error('[submissions/complete] completion transaction failed', {
        code: completeError?.code,
      })
      return errorResponse(
        completeError?.message.includes('upload_verification_failed')
          ? 'UPLOAD_INCOMPLETE'
          : 'SERVICE_UNAVAILABLE',
        completeError?.message.includes('upload_verification_failed')
          ? 409
          : 503,
      )
    }

    const completed = completedRows[0]
    const generationStatus = await ensureAutomationStarted(
      submission.id,
      service,
    )
    const response: SubmissionCompleteResponse = {
      submissionId: submission.id,
      publicReference: completed.public_reference,
      vehicleModel: completed.vehicle_model,
      photoCount: completed.photo_count,
      resultUrl: getResultUrl(submission.id).toString(),
      generationStatus:
        generationStatus === 'ready'
          ? 'ready'
          : generationStatus === 'preview_ready'
            ? 'preview_ready'
            : 'generating_preview',
    }

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'upload_verification_failed'
    ) {
      return errorResponse('UPLOAD_INCOMPLETE', 409)
    }

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

    console.error('[submissions/complete] unavailable', {
      ...(process.env.NODE_ENV === 'development' && error instanceof Error
        ? { message: error.message }
        : {}),
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return errorResponse('SERVICE_UNAVAILABLE', 503)
  }
}
