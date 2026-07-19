import { randomBytes } from 'node:crypto'

import { NextResponse } from 'next/server'

import {
  AUTOPOST_PACKAGE_CURRENCY,
  AUTOPOST_PACKAGE_PRICE,
  isCheckoutConfigured,
} from '@/lib/fulfillment/config'
import { getResultUrl, verifyResultToken } from '@/lib/fulfillment/result-token'
import { createTbcPayment } from '@/lib/payments/tbc'
import { getClientIp } from '@/lib/security/request'
import { getSiteUrl } from '@/lib/site-url'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const english = new URL(request.url).searchParams.get('lang') === 'en'
  const { token } = await context.params
  const submissionId = verifyResultToken(token)
  if (!submissionId) {
    return NextResponse.json(
      { error: 'Invalid result link.' },
      { status: 404, headers: NO_STORE_HEADERS },
    )
  }
  if (!isCheckoutConfigured()) {
    return NextResponse.json(
      { error: 'გადახდა ჯერ არ არის გააქტიურებული.' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }

  const service = getServiceSupabaseClient()
  const [
    submissionResult,
    fulfillmentResult,
    existingPaymentResult,
    previewReelResult,
  ] = await Promise.all([
    service
      .from('submissions')
      .select('public_reference')
      .eq('id', submissionId)
      .eq('upload_state', 'complete')
      .maybeSingle(),
    service
      .from('fulfillments')
      .select('status')
      .eq('submission_id', submissionId)
      .maybeSingle(),
    service
      .from('payments')
      .select('checkout_url, created_at, status')
      .eq('submission_id', submissionId)
      .in('status', ['created', 'processing', 'succeeded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from('generated_assets')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('access_tier', 'preview')
      .eq('asset_kind', 'reel')
      .maybeSingle(),
  ])

  if (
    submissionResult.error ||
    fulfillmentResult.error ||
    existingPaymentResult.error ||
    previewReelResult.error ||
    !submissionResult.data ||
    !fulfillmentResult.data
  ) {
    return NextResponse.json(
      { error: 'შედეგი ვერ მოიძებნა.' },
      { status: 404, headers: NO_STORE_HEADERS },
    )
  }

  if (existingPaymentResult.data?.status === 'succeeded') {
    return NextResponse.json(
      { paid: true, resultUrl: getResultUrl(submissionId).toString() },
      { headers: NO_STORE_HEADERS },
    )
  }

  const existingAge = existingPaymentResult.data
    ? Date.now() - new Date(existingPaymentResult.data.created_at).getTime()
    : Number.POSITIVE_INFINITY
  if (
    existingPaymentResult.data?.checkout_url &&
    (existingPaymentResult.data.status === 'processing' ||
      existingAge < 12 * 60 * 1000)
  ) {
    return NextResponse.json(
      { checkoutUrl: existingPaymentResult.data.checkout_url },
      { headers: NO_STORE_HEADERS },
    )
  }

  if (
    existingPaymentResult.data?.status === 'created' &&
    existingAge >= 12 * 60 * 1000
  ) {
    const { error: expireError } = await service
      .from('payments')
      .update({ status: 'expired' })
      .eq('submission_id', submissionId)
      .eq('status', 'created')
      .eq('created_at', existingPaymentResult.data.created_at)
    if (expireError) {
      return NextResponse.json(
        { error: 'გადახდის დაწყება დროებით ვერ მოხერხდა.' },
        { status: 503, headers: NO_STORE_HEADERS },
      )
    }
  }

  if (
    !['preview_ready', 'generating_paid', 'ready'].includes(
      fulfillmentResult.data.status,
    ) ||
    !previewReelResult.data
  ) {
    return NextResponse.json(
      { error: 'Preview ჯერ მზად არ არის.' },
      { status: 409, headers: NO_STORE_HEADERS },
    )
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error: countError } = await service
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('submission_id', submissionId)
    .gte('created_at', oneHourAgo)
  if (countError || (count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'ცოტა ხანში კიდევ სცადეთ.' },
      { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': '900' } },
    )
  }

  const merchantPaymentId = `${submissionResult.data.public_reference.replace('-', '')}-${randomBytes(6).toString('hex').toUpperCase()}`
  const { data: payment, error: insertError } = await service
    .from('payments')
    .insert({
      amount: AUTOPOST_PACKAGE_PRICE,
      currency: AUTOPOST_PACKAGE_CURRENCY,
      merchant_payment_id: merchantPaymentId,
      submission_id: submissionId,
    })
    .select('id')
    .single()
  if (insertError || !payment) {
    if (insertError?.code === '23505') {
      const { data: activePayment } = await service
        .from('payments')
        .select('checkout_url')
        .eq('submission_id', submissionId)
        .in('status', ['created', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (activePayment?.checkout_url) {
        return NextResponse.json(
          { checkoutUrl: activePayment.checkout_url },
          { headers: NO_STORE_HEADERS },
        )
      }
    }
    return NextResponse.json(
      { error: 'გადახდის დაწყება ვერ მოხერხდა.' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const resultUrl = getResultUrl(submissionId)
    resultUrl.searchParams.set('payment', 'return')
    if (english) resultUrl.searchParams.set('lang', 'en')
    const callbackUrl = new URL('/api/payments/tbc/callback', getSiteUrl())
    const created = await createTbcPayment({
      callbackUrl: callbackUrl.toString(),
      merchantPaymentId,
      returnUrl: resultUrl.toString(),
      userIpAddress: getClientIp(request),
    })
    const { error: updateError } = await service
      .from('payments')
      .update({
        checkout_url: created.approvalUrl,
        provider_payment_id: created.payId,
      })
      .eq('id', payment.id)
    if (updateError) throw new Error('payment_update_failed')
    return NextResponse.json(
      { checkoutUrl: created.approvalUrl },
      { headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    await service
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id)
    console.error('[payments/tbc] checkout creation failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.json(
      { error: 'გადახდის დაწყება დროებით ვერ მოხერხდა.' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}
