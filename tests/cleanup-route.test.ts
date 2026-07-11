import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  getServiceSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => serviceMocks)

import { GET as cleanup } from '@/app/api/cron/cleanup/route'

const SUBMISSION_ID = '123e4567-e89b-42d3-a456-426614174000'
const CLAIM_TOKEN = '223e4567-e89b-42d3-a456-426614174000'

const CRON_SECRET = 'c'.repeat(32)

function cleanupRequest(secret = CRON_SECRET) {
  return new Request('http://localhost:3000/api/cron/cleanup', {
    headers: { Authorization: `Bearer ${secret}` },
  })
}

function cleanupService(
  options: {
    claimCount?: number
    storageError?: boolean
    yieldStorage?: boolean
  } = {},
) {
  const claimCount = options.claimCount ?? 1
  const claims = Array.from({ length: claimCount }, (_, index) => ({
    submission_id:
      index === 0
        ? SUBMISSION_ID
        : `123e4567-e89b-42d3-a456-${String(426_614_174_000 + index).padStart(12, '0')}`,
    claim_token:
      index === 0
        ? CLAIM_TOKEN
        : `223e4567-e89b-42d3-a456-${String(426_614_174_000 + index).padStart(12, '0')}`,
  }))
  const removedSubmissionIds = new Set<string>()
  const concurrency = {
    activeRemovals: 0,
    deleteAfterStorage: true,
    maxActiveRemovals: 0,
  }
  const remove = vi.fn(async (paths: string[]) => {
    concurrency.activeRemovals += 1
    concurrency.maxActiveRemovals = Math.max(
      concurrency.maxActiveRemovals,
      concurrency.activeRemovals,
    )

    if (options.yieldStorage) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }

    concurrency.activeRemovals -= 1
    if (!options.storageError) {
      for (const path of paths) {
        const submissionId = path.split('/')[1]
        if (submissionId) removedSubmissionIds.add(submissionId)
      }
    }

    return {
      data: options.storageError ? null : [],
      error: options.storageError ? { message: 'storage unavailable' } : null,
    }
  })
  const rpc = vi.fn(async (name: string, args?: Record<string, string>) => {
    if (name === 'claim_stale_submissions') {
      return {
        data: claims,
        error: null,
      }
    }
    if (name === 'delete_claimed_submission') {
      if (!removedSubmissionIds.has(args?.p_submission_id ?? '')) {
        concurrency.deleteAfterStorage = false
      }
      return { data: true, error: null }
    }
    if (name === 'cleanup_expired_rate_limit_events') {
      return { data: 12, error: null }
    }
    throw new Error(`Unexpected RPC: ${name}`)
  })
  const query = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({
      data: claims.map((claim) => ({
        submission_id: claim.submission_id,
        storage_path: `submissions/${claim.submission_id}/photo.jpg`,
      })),
      error: null,
    }),
  }

  return {
    rpc,
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ remove })) },
    concurrency,
    remove,
  }
}

describe('GET /api/cron/cleanup', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = CRON_SECRET
    serviceMocks.getServiceSupabaseClient.mockReset()
  })

  it('rejects requests without the configured bearer secret', async () => {
    const response = await cleanup(
      new Request('http://localhost:3000/api/cron/cleanup'),
    )

    expect(response.status).toBe(401)
    expect(serviceMocks.getServiceSupabaseClient).not.toHaveBeenCalled()
  })

  it('removes private objects before finalizing a claimed row', async () => {
    const service = cleanupService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await cleanup(cleanupRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      ok: true,
      claimedSubmissions: 1,
      deletedSubmissions: 1,
      deletedRateEvents: 12,
    })
    expect(service.rpc).toHaveBeenCalledWith('claim_stale_submissions', {
      p_batch_size: 100,
      p_stale_before: expect.any(String),
    })
    expect(service.remove).toHaveBeenCalledWith([
      `submissions/${SUBMISSION_ID}/photo.jpg`,
    ])
    expect(service.rpc).toHaveBeenCalledWith('delete_claimed_submission', {
      p_claim_token: CLAIM_TOKEN,
      p_submission_id: SUBMISSION_ID,
    })
  })

  it('keeps the claimed database row when Storage deletion fails', async () => {
    const service = cleanupService({ storageError: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await cleanup(cleanupRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({
      ok: false,
      deletedSubmissions: 0,
      failedSubmissionIds: [SUBMISSION_ID],
    })
    expect(
      service.rpc.mock.calls.some(
        ([name]) => name === 'delete_claimed_submission',
      ),
    ).toBe(false)
    expect(service.rpc).toHaveBeenCalledWith(
      'cleanup_expired_rate_limit_events',
      expect.any(Object),
    )
  })

  it('processes a large batch with bounded concurrency and per-claim ordering', async () => {
    const service = cleanupService({ claimCount: 12, yieldStorage: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await cleanup(cleanupRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      ok: true,
      claimedSubmissions: 12,
      deletedSubmissions: 12,
      failedSubmissionIds: [],
    })
    expect(service.remove).toHaveBeenCalledTimes(12)
    expect(service.concurrency.maxActiveRemovals).toBe(10)
    expect(service.concurrency.deleteAfterStorage).toBe(true)
  })
})
