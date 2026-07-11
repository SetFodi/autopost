import { NextResponse } from 'next/server'

import { toAnalyticsJson } from '@/lib/analytics/events'
import { readLimitedJson } from '@/lib/security/json'
import {
  hashClientIp,
  PUBLIC_ANALYTICS_RATE_LIMIT,
} from '@/lib/security/request'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { publicAnalyticsSchema } from '@/lib/validation/analytics'
import type { AnalyticsMetadata } from '@/lib/analytics/events'

export const runtime = 'nodejs'

const MAX_ANALYTICS_BODY_BYTES = 8 * 1024
const SAFE_METADATA_KEYS = new Set([
  'addedCount',
  'device',
  'fileCount',
  'formStep',
  'page',
  'path',
  'photoCount',
  'placement',
  'section',
  'source',
  'totalCount',
])
const SAFE_TOKEN = /^[a-zA-Z0-9_-]{1,40}$/

function sanitizeMetadata(metadata: AnalyticsMetadata): AnalyticsMetadata {
  const sanitized: AnalyticsMetadata = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue
    if (
      typeof value === 'string' &&
      !SAFE_TOKEN.test(value) &&
      !((key === 'page' || key === 'path') && value === '/')
    ) {
      continue
    }
    sanitized[key] = value
  }

  return sanitized
}

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await readLimitedJson(request, MAX_ANALYTICS_BODY_BYTES)
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const bodyResult = publicAnalyticsSchema.safeParse(rawBody)
  if (!bodyResult.success) return new NextResponse(null, { status: 204 })

  try {
    const service = getServiceSupabaseClient()
    const { data: limitRows, error: limitError } = await service.rpc(
      'consume_rate_limit',
      {
        p_ip_hash: hashClientIp(request),
        p_limit: PUBLIC_ANALYTICS_RATE_LIMIT.limit,
        p_scope: 'public_analytics',
        p_window_seconds: PUBLIC_ANALYTICS_RATE_LIMIT.windowSeconds,
      },
    )

    if (limitError || !limitRows?.[0]?.allowed) {
      return new NextResponse(null, { status: 204 })
    }

    let submissionId: string | null = null
    if (bodyResult.data.submissionId) {
      const { data } = await service
        .from('submissions')
        .select('id')
        .eq('id', bodyResult.data.submissionId)
        .eq('upload_state', 'complete')
        .maybeSingle()
      submissionId = data?.id ?? null
    }

    await service.from('analytics_events').insert({
      event_name: bodyResult.data.eventName,
      metadata: toAnalyticsJson(sanitizeMetadata(bodyResult.data.metadata)),
      submission_id: submissionId,
    })
  } catch {
    // Analytics is intentionally best-effort and independent from conversion.
  }

  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
