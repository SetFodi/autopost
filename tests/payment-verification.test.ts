import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  getServiceSupabaseClient: vi.fn(),
}))
const tbcMocks = vi.hoisted(() => ({
  getTbcPaymentDetails: vi.fn(),
}))
const workflowApiMocks = vi.hoisted(() => ({ start: vi.fn() }))

vi.mock('@/lib/supabase/admin', () => supabaseMocks)
vi.mock('@/lib/payments/tbc', () => tbcMocks)
vi.mock('@/lib/fulfillment/result-token', () => ({
  getResultUrl: (submissionId: string) =>
    new URL(`https://autopost.ge/result/${submissionId}`),
}))
vi.mock('@/workflows/fulfillment', () => ({
  paidFulfillmentWorkflow: vi.fn(),
}))
vi.mock('workflow/api', () => workflowApiMocks)

import { verifyAndRecordTbcPayment } from '@/lib/payments/verification'

const SUBMISSION_ID = '123e4567-e89b-42d3-a456-426614174000'
const START_TOKEN = 'starting:123e4567-e89b-42d3-a456-426614174001'

function createService(shouldStart: boolean) {
  const paymentQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { submission_id: SUBMISSION_ID },
      error: null,
    }),
  }
  const fulfillmentEq = vi.fn()
  const fulfillmentQuery = {
    update: vi.fn().mockReturnThis(),
    eq: fulfillmentEq,
  }
  fulfillmentEq.mockReturnValueOnce(fulfillmentQuery).mockResolvedValueOnce({
    data: null,
    error: null,
  })

  return {
    from: vi.fn((table: string) =>
      table === 'payments' ? paymentQuery : fulfillmentQuery,
    ),
    rpc: vi.fn().mockResolvedValue({
      data: [
        {
          paid_start_token: shouldStart ? START_TOKEN : null,
          payment_status: 'succeeded',
          should_start_paid_generation: shouldStart,
          submission_id: SUBMISSION_ID,
        },
      ],
      error: null,
    }),
    fulfillmentQuery,
  }
}

describe('verified TBC payment fulfillment', () => {
  beforeEach(() => {
    supabaseMocks.getServiceSupabaseClient.mockReset()
    tbcMocks.getTbcPaymentDetails.mockReset()
    workflowApiMocks.start.mockReset()
    tbcMocks.getTbcPaymentDetails.mockResolvedValue({
      amount: 14.9,
      currency: 'GEL',
      payId: 'pay-123',
      resultCode: 'Approved',
      status: 'Succeeded',
    })
    workflowApiMocks.start.mockResolvedValue({ runId: 'wrun_paid_123' })
  })

  it('starts the paid workflow only when the database grants its reservation', async () => {
    const service = createService(true)
    supabaseMocks.getServiceSupabaseClient.mockReturnValue(service)

    await expect(verifyAndRecordTbcPayment('pay-123')).resolves.toEqual({
      paymentStatus: 'succeeded',
      submissionId: SUBMISSION_ID,
    })

    expect(workflowApiMocks.start).toHaveBeenCalledTimes(1)
    expect(service.fulfillmentQuery.update).toHaveBeenCalledWith({
      paid_workflow_run_id: 'wrun_paid_123',
    })
    expect(service.fulfillmentQuery.eq).toHaveBeenNthCalledWith(
      2,
      'paid_workflow_run_id',
      START_TOKEN,
    )
  })

  it('does not start a duplicate workflow for a repeated success callback', async () => {
    const service = createService(false)
    supabaseMocks.getServiceSupabaseClient.mockReturnValue(service)

    await verifyAndRecordTbcPayment('pay-123')

    expect(workflowApiMocks.start).not.toHaveBeenCalled()
    expect(service.from).toHaveBeenCalledTimes(1)
  })
})
