import { NextResponse } from 'next/server'

import { verifyResultToken } from '@/lib/fulfillment/result-token'
import { verifyAndRecordTbcPayment } from '@/lib/payments/verification'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const submissionId = verifyResultToken(token)
  if (!submissionId) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: NO_STORE_HEADERS },
    )
  }

  const { data: payment, error } = await getServiceSupabaseClient()
    .from('payments')
    .select('provider_payment_id, status')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !payment) {
    return NextResponse.json({ status: null }, { headers: NO_STORE_HEADERS })
  }

  if (
    payment.provider_payment_id &&
    ['created', 'processing'].includes(payment.status)
  ) {
    try {
      const verified = await verifyAndRecordTbcPayment(
        payment.provider_payment_id,
      )
      return NextResponse.json(
        { status: verified.paymentStatus },
        { headers: NO_STORE_HEADERS },
      )
    } catch (verificationError) {
      console.error('[payments/tbc] result sync failed', {
        name:
          verificationError instanceof Error
            ? verificationError.name
            : 'UnknownError',
      })
      return NextResponse.json(
        { status: payment.status },
        { status: 503, headers: NO_STORE_HEADERS },
      )
    }
  }

  return NextResponse.json(
    { status: payment.status },
    { headers: NO_STORE_HEADERS },
  )
}
