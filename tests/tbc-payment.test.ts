import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTbcPayment,
  getTbcPaymentDetails,
  TbcPaymentError,
} from '@/lib/payments/tbc'

const ACCESS_TOKEN = 'access-token-that-is-long-enough'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('TBC Checkout client', () => {
  beforeEach(() => {
    process.env.TBC_API_KEY = 'api-key'
    process.env.TBC_CLIENT_ID = 'client-id'
    process.env.TBC_CLIENT_SECRET = 'client-secret'
    process.env.TBC_API_BASE_URL = 'https://api.tbcbank.ge/v1'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.TBC_API_KEY
    delete process.env.TBC_CLIENT_ID
    delete process.env.TBC_CLIENT_SECRET
    delete process.env.TBC_API_BASE_URL
  })

  it('creates an exact 14.90 GEL checkout and accepts only the TBC approval URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: ACCESS_TOKEN,
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          amount: 14.9,
          currency: 'GEL',
          links: [
            {
              method: 'REDIRECT',
              rel: 'approval_url',
              uri: 'https://tpay.tbcbank.ge/checkout/choose-payment-method/pay-123',
            },
          ],
          payId: 'pay-123',
          status: 'Created',
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await createTbcPayment({
      callbackUrl: 'https://autopost.ge/api/payments/tbc/callback',
      merchantPaymentId: 'AP1234567890-ABCDEF123456',
      returnUrl: 'https://autopost.ge/result/signed-token',
      userIpAddress: '203.0.113.42',
    })

    expect(result).toEqual({
      approvalUrl:
        'https://tpay.tbcbank.ge/checkout/choose-payment-method/pay-123',
      payId: 'pay-123',
    })
    const paymentRequest = fetchMock.mock.calls[1]!
    expect(paymentRequest[0]).toBe('https://api.tbcbank.ge/v1/tpay/payments')
    expect(JSON.parse(String(paymentRequest[1]?.body))).toMatchObject({
      amount: { currency: 'GEL', total: 14.9 },
      callbackUrl: 'https://autopost.ge/api/payments/tbc/callback',
      merchantPaymentId: 'AP1234567890-ABCDEF123456',
      preAuth: false,
      returnurl: 'https://autopost.ge/result/signed-token',
      userIpAddress: '203.0.113.42',
    })
  })

  it('rejects a non-TBC approval redirect returned by the provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: ACCESS_TOKEN,
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            amount: 14.9,
            currency: 'GEL',
            links: [
              {
                method: 'REDIRECT',
                rel: 'approval_url',
                uri: 'https://evil.example/checkout',
              },
            ],
            payId: 'pay-123',
            status: 'Created',
          }),
        ),
    )

    await expect(
      createTbcPayment({
        callbackUrl: 'https://autopost.ge/api/payments/tbc/callback',
        merchantPaymentId: 'AP1234567890-ABCDEF123456',
        returnUrl: 'https://autopost.ge/result/signed-token',
      }),
    ).rejects.toMatchObject({
      name: TbcPaymentError.name,
      message: 'tbc_approval_url_invalid',
    })
  })

  it('reads the payment amount, currency, id, and final status from TBC', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            access_token: ACCESS_TOKEN,
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            amount: 14.9,
            currency: 'GEL',
            payId: 'pay-123',
            resultCode: 'Approved',
            status: 'Succeeded',
          }),
        ),
    )

    await expect(getTbcPaymentDetails('pay-123')).resolves.toEqual({
      amount: 14.9,
      currency: 'GEL',
      payId: 'pay-123',
      resultCode: 'Approved',
      status: 'Succeeded',
    })
  })
})
