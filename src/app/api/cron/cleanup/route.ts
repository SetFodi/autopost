import 'server-only'

import { timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'

import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { SUBMISSION_BUCKET } from '@/lib/validation/submission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CLEANUP_BATCH_SIZE = 50
const STALE_SUBMISSION_MS = 24 * 60 * 60 * 1000
const RATE_EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization') ?? ''
  const expectedAuthorization = cronSecret ? `Bearer ${cronSecret}` : ''
  const authorized =
    Boolean(cronSecret && cronSecret.length >= 32) &&
    authorization.length === expectedAuthorization.length &&
    timingSafeEqual(
      Buffer.from(authorization),
      Buffer.from(expectedAuthorization),
    )

  if (!authorized) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: NO_STORE_HEADERS },
    )
  }

  const service = getServiceSupabaseClient()
  const now = Date.now()
  const { data: claims, error: claimError } = await service.rpc(
    'claim_stale_submissions',
    {
      p_batch_size: CLEANUP_BATCH_SIZE,
      p_stale_before: new Date(now - STALE_SUBMISSION_MS).toISOString(),
    },
  )

  if (claimError) {
    console.error('[cron/cleanup] stale submission claim failed', {
      code: claimError.code,
    })
    return NextResponse.json(
      { ok: false, error: 'Cleanup unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }

  const claimed = claims ?? []
  let deletedSubmissions = 0
  const failedSubmissionIds: string[] = []

  if (claimed.length > 0) {
    const { data: fileRows, error: filesError } = await service
      .from('submission_files')
      .select('submission_id, storage_path')
      .in(
        'submission_id',
        claimed.map((claim) => claim.submission_id),
      )

    if (filesError) {
      console.error('[cron/cleanup] cleanup file lookup failed', {
        code: filesError.code,
      })
      failedSubmissionIds.push(...claimed.map((claim) => claim.submission_id))
    } else {
      const pathsBySubmission = new Map<string, string[]>()
      for (const file of fileRows ?? []) {
        const paths = pathsBySubmission.get(file.submission_id) ?? []
        paths.push(file.storage_path)
        pathsBySubmission.set(file.submission_id, paths)
      }

      for (const claim of claimed) {
        const paths = pathsBySubmission.get(claim.submission_id) ?? []
        if (paths.length > 0) {
          const { error: removeError } = await service.storage
            .from(SUBMISSION_BUCKET)
            .remove(paths)

          if (removeError) {
            console.error('[cron/cleanup] storage removal failed', {
              submissionId: claim.submission_id,
            })
            failedSubmissionIds.push(claim.submission_id)
            continue
          }
        }

        const { data: deleted, error: deleteError } = await service.rpc(
          'delete_claimed_submission',
          {
            p_claim_token: claim.claim_token,
            p_submission_id: claim.submission_id,
          },
        )

        if (deleteError || !deleted) {
          console.error('[cron/cleanup] claimed row deletion failed', {
            code: deleteError?.code,
            submissionId: claim.submission_id,
          })
          failedSubmissionIds.push(claim.submission_id)
          continue
        }

        deletedSubmissions += 1
      }
    }
  }

  const { data: deletedRateEvents, error: rateCleanupError } =
    await service.rpc('cleanup_expired_rate_limit_events', {
      p_expired_before: new Date(now - RATE_EVENT_RETENTION_MS).toISOString(),
    })

  if (rateCleanupError) {
    console.error('[cron/cleanup] rate event cleanup failed', {
      code: rateCleanupError.code,
    })
  }

  const ok = failedSubmissionIds.length === 0 && !rateCleanupError
  return NextResponse.json(
    {
      ok,
      claimedSubmissions: claimed.length,
      deletedSubmissions,
      failedSubmissionIds,
      deletedRateEvents: deletedRateEvents ?? 0,
    },
    {
      status: ok ? 200 : 500,
      headers: NO_STORE_HEADERS,
    },
  )
}
