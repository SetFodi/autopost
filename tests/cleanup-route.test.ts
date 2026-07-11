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

function cleanupService(options: { storageError?: boolean } = {}) {
  const remove = vi.fn().mockResolvedValue({
    data: options.storageError ? null : [],
    error: options.storageError ? { message: 'storage unavailable' } : null,
  })
  const rpc = vi.fn(async (name: string) => {
    if (name === 'claim_stale_submissions') {
      return {
        data: [{ submission_id: SUBMISSION_ID, claim_token: CLAIM_TOKEN }],
        error: null,
      }
    }
    if (name === 'delete_claimed_submission') {
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
      data: [
        {
          submission_id: SUBMISSION_ID,
          storage_path: `submissions/${SUBMISSION_ID}/photo.jpg`,
        },
      ],
      error: null,
    }),
  }

  return {
    rpc,
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ remove })) },
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
})
