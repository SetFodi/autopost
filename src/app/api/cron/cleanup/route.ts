import 'server-only'

import { timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'

import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { SUBMISSION_BUCKET } from '@/lib/validation/submission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CLEANUP_BATCH_SIZE = 100
const CLEANUP_CONCURRENCY = 10
const STALE_SUBMISSION_MS = 24 * 60 * 60 * 1000
const RATE_EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
const TOMBSTONE_BATCH_SIZE = 100

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

      for (
        let offset = 0;
        offset < claimed.length;
        offset += CLEANUP_CONCURRENCY
      ) {
        const batch = claimed.slice(offset, offset + CLEANUP_CONCURRENCY)
        const results = await Promise.all(
          batch.map(async (claim) => {
            const paths = pathsBySubmission.get(claim.submission_id) ?? []
            if (paths.length > 0) {
              const { error: removeError } = await service.storage
                .from(SUBMISSION_BUCKET)
                .remove(paths)

              if (removeError) {
                console.error('[cron/cleanup] storage removal failed', {
                  submissionId: claim.submission_id,
                })
                return { deleted: false, submissionId: claim.submission_id }
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
              return { deleted: false, submissionId: claim.submission_id }
            }

            return { deleted: true, submissionId: claim.submission_id }
          }),
        )

        for (const result of results) {
          if (result.deleted) deletedSubmissions += 1
          else failedSubmissionIds.push(result.submissionId)
        }
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

  const { data: tombstones, error: tombstoneClaimError } = await service.rpc(
    'claim_due_deletion_tombstones',
    { p_batch_size: TOMBSTONE_BATCH_SIZE },
  )
  let clearedTombstones = 0
  const failedTombstoneIds: string[] = []

  if (tombstoneClaimError) {
    console.error('[cron/cleanup] tombstone claim failed', {
      code: tombstoneClaimError.code,
    })
  } else {
    for (const tombstone of tombstones ?? []) {
      const prefix = tombstone.storage_prefix.replace(/\/$/, '')
      const { data: recreated, error: listError } = await service.storage
        .from(SUBMISSION_BUCKET)
        .list(prefix, { limit: 100 })
      if (listError) {
        failedTombstoneIds.push(tombstone.submission_id)
        continue
      }

      const recreatedPaths = (recreated ?? [])
        .filter((item) => item.id)
        .map((item) => `${prefix}/${item.name}`)
      if (recreatedPaths.length > 0) {
        const { error: removeError } = await service.storage
          .from(SUBMISSION_BUCKET)
          .remove(recreatedPaths)
        if (removeError) {
          failedTombstoneIds.push(tombstone.submission_id)
          continue
        }
      }

      const { data: deleted, error: deleteError } = await service.rpc(
        'delete_claimed_deletion_tombstone',
        {
          p_claim_token: tombstone.claim_token,
          p_submission_id: tombstone.submission_id,
        },
      )
      if (deleteError || !deleted) {
        failedTombstoneIds.push(tombstone.submission_id)
      } else {
        clearedTombstones += 1
      }
    }
  }

  const ok =
    failedSubmissionIds.length === 0 &&
    failedTombstoneIds.length === 0 &&
    !rateCleanupError &&
    !tombstoneClaimError
  return NextResponse.json(
    {
      ok,
      claimedSubmissions: claimed.length,
      deletedSubmissions,
      failedSubmissionIds,
      deletedRateEvents: deletedRateEvents ?? 0,
      claimedTombstones: tombstones?.length ?? 0,
      clearedTombstones,
      failedTombstoneIds,
    },
    {
      status: ok ? 200 : 500,
      headers: NO_STORE_HEADERS,
    },
  )
}
