import 'server-only'

import { start } from 'workflow/api'

import { getResultUrl } from '@/lib/fulfillment/result-token'
import { getTbcPaymentDetails } from '@/lib/payments/tbc'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { paidFulfillmentWorkflow } from '@/workflows/fulfillment'

export async function verifyAndRecordTbcPayment(payId: string) {
  const service = getServiceSupabaseClient()
  const { data: knownPayment, error: lookupError } = await service
    .from('payments')
    .select('submission_id')
    .eq('provider', 'tbc')
    .eq('provider_payment_id', payId)
    .maybeSingle()
  if (lookupError || !knownPayment) throw new Error('payment_not_found')

  const details = await getTbcPaymentDetails(payId)
  const verifiedPayload = {
    amount: details.amount,
    currency: details.currency,
    payId: details.payId,
    resultCode: details.resultCode ?? null,
    status: details.status,
  }
  const { data: confirmationRows, error: confirmationError } =
    await service.rpc('confirm_tbc_payment', {
      p_amount: details.amount,
      p_currency: details.currency,
      p_delivery_url: getResultUrl(knownPayment.submission_id).toString(),
      p_provider_payment_id: payId,
      p_provider_status: details.status,
      p_result_code: details.resultCode ?? '',
      p_verified_payload: verifiedPayload,
    })
  const confirmation = confirmationRows?.[0]
  if (confirmationError || !confirmation) {
    throw new Error('payment_confirmation_failed')
  }

  if (
    confirmation.should_start_paid_generation &&
    confirmation.paid_start_token
  ) {
    try {
      const run = await start(paidFulfillmentWorkflow, [
        confirmation.submission_id,
      ])
      const { error: runUpdateError } = await service
        .from('fulfillments')
        .update({ paid_workflow_run_id: run.runId })
        .eq('submission_id', confirmation.submission_id)
        .eq('paid_workflow_run_id', confirmation.paid_start_token)
      if (runUpdateError) throw new Error('paid_workflow_record_failed')
    } catch (error) {
      await service
        .from('fulfillments')
        .update({
          failed_at: new Date().toISOString(),
          last_error_code: 'workflow_start_failed',
          paid_workflow_run_id: null,
          status: 'failed',
        })
        .eq('submission_id', confirmation.submission_id)
        .eq('paid_workflow_run_id', confirmation.paid_start_token)
      throw error
    }
  }

  return {
    paymentStatus: confirmation.payment_status,
    submissionId: confirmation.submission_id,
  }
}
