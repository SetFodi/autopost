import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  isCheckoutConfigured,
  isRemotionConfigured,
} from '@/lib/fulfillment/config'

const ENV_KEYS = [
  'TBC_API_KEY',
  'TBC_CLIENT_ID',
  'TBC_CLIENT_SECRET',
  'TBC_API_BASE_URL',
  'VERCEL',
  'VERCEL_OIDC_TOKEN',
] as const
const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('fulfillment integration availability', () => {
  it('enables Sandbox rendering automatically in a Vercel deployment', () => {
    process.env.VERCEL = '1'

    expect(isRemotionConfigured()).toBe(true)
  })

  it('enables authenticated local Sandbox rendering through Vercel OIDC', () => {
    process.env.VERCEL_OIDC_TOKEN = 'local-oidc-token'

    expect(isRemotionConfigured()).toBe(true)
  })

  it('does not advertise checkout until both Sandbox and TBC are available', () => {
    process.env.VERCEL = '1'
    expect(isCheckoutConfigured()).toBe(false)

    process.env.TBC_API_KEY = 'api-key'
    process.env.TBC_CLIENT_ID = 'client-id'
    process.env.TBC_CLIENT_SECRET = 'client-secret'

    expect(isCheckoutConfigured()).toBe(true)
  })
})
