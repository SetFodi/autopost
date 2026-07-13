import 'server-only'

import { z } from 'zod'

import { getTbcConfig } from '@/lib/fulfillment/config'

const TBC_TIMEOUT_MS = 15_000

const accessTokenSchema = z.object({
  access_token: z.string().min(20),
  expires_in: z.number().int().positive(),
  token_type: z.literal('Bearer'),
})

const linkSchema = z.object({
  method: z.string(),
  rel: z.string(),
  uri: z.string().url(),
})

const createPaymentSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  links: z.array(linkSchema),
  payId: z.string().min(3).max(120),
  status: z.literal('Created'),
})

export const paymentDetailsSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  payId: z.string().min(3).max(120),
  resultCode: z.string().max(120).nullish(),
  status: z.enum([
    'Created',
    'Processing',
    'Succeeded',
    'Failed',
    'Expired',
    'WaitingConfirm',
    'CancelPaymentProcessing',
    'PaymentCompletionProcessing',
    'Returned',
    'PartialReturned',
  ]),
})

export type TbcPaymentDetails = z.infer<typeof paymentDetailsSchema>

export class TbcPaymentError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message)
    this.name = 'TbcPaymentError'
  }
}

async function tbcFetch(url: string, init: RequestInit) {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), TBC_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: abortController.signal,
    })
  } catch {
    throw new TbcPaymentError('tbc_network_error')
  } finally {
    clearTimeout(timeout)
  }
}

async function getAccessToken() {
  const config = getTbcConfig()
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })
  const response = await tbcFetch(`${config.baseUrl}/tpay/access-token`, {
    body,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: config.apiKey,
    },
    method: 'POST',
  })
  if (!response.ok) {
    throw new TbcPaymentError('tbc_access_token_failed', response.status)
  }
  const parsed = accessTokenSchema.safeParse(await response.json())
  if (!parsed.success) throw new TbcPaymentError('tbc_access_token_invalid')
  return parsed.data.access_token
}

export async function createTbcPayment(input: {
  callbackUrl: string
  merchantPaymentId: string
  returnUrl: string
  userIpAddress?: string
}) {
  const config = getTbcConfig()
  const accessToken = await getAccessToken()
  const response = await tbcFetch(`${config.baseUrl}/tpay/payments`, {
    body: JSON.stringify({
      amount: { currency: 'GEL', total: 14.9 },
      callbackUrl: input.callbackUrl,
      description: 'AutoPost social package',
      expirationMinutes: 12,
      language: 'KA',
      merchantPaymentId: input.merchantPaymentId,
      preAuth: false,
      returnurl: input.returnUrl,
      ...(input.userIpAddress && input.userIpAddress !== 'unknown'
        ? { userIpAddress: input.userIpAddress }
        : {}),
    }),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: config.apiKey,
    },
    method: 'POST',
  })
  if (!response.ok) {
    throw new TbcPaymentError('tbc_payment_create_failed', response.status)
  }
  const parsed = createPaymentSchema.safeParse(await response.json())
  if (
    !parsed.success ||
    parsed.data.amount !== 14.9 ||
    parsed.data.currency !== 'GEL'
  ) {
    throw new TbcPaymentError('tbc_payment_create_invalid')
  }
  const approval = parsed.data.links.find(
    (link) => link.rel === 'approval_url' && link.method === 'REDIRECT',
  )
  if (!approval || !/^https:\/\/tpay\.tbcbank\.ge\//.test(approval.uri)) {
    throw new TbcPaymentError('tbc_approval_url_invalid')
  }
  return { approvalUrl: approval.uri, payId: parsed.data.payId }
}

export async function getTbcPaymentDetails(payId: string) {
  if (!/^[A-Za-z0-9_-]{3,120}$/.test(payId)) {
    throw new TbcPaymentError('tbc_payment_id_invalid')
  }
  const config = getTbcConfig()
  const accessToken = await getAccessToken()
  const response = await tbcFetch(
    `${config.baseUrl}/tpay/payments/${encodeURIComponent(payId)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: config.apiKey,
      },
      method: 'GET',
    },
  )
  if (!response.ok) {
    throw new TbcPaymentError('tbc_payment_details_failed', response.status)
  }
  const parsed = paymentDetailsSchema.safeParse(await response.json())
  if (!parsed.success || parsed.data.payId !== payId) {
    throw new TbcPaymentError('tbc_payment_details_invalid')
  }
  return parsed.data
}
