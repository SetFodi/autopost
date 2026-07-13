import 'server-only'

export const AUTOPOST_PACKAGE_PRICE = 14.9
export const AUTOPOST_PACKAGE_CURRENCY = 'GEL' as const
export const GENERATED_BUCKET = 'vehicle-generated'
export const RESULT_ASSET_URL_TTL_SECONDS = 10 * 60

export class FulfillmentConfigurationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing fulfillment configuration: ${missing.join(', ')}`)
    this.name = 'FulfillmentConfigurationError'
  }
}

export function getResultTokenSecret() {
  const secret =
    process.env.RESULT_TOKEN_SECRET?.trim() ||
    process.env.RATE_LIMIT_IP_HASH_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new FulfillmentConfigurationError([
      'RESULT_TOKEN_SECRET (or RATE_LIMIT_IP_HASH_SECRET fallback)',
    ])
  }
  return secret
}

export function isRemotionConfigured() {
  // Vercel injects OIDC credentials automatically in deployments. Locally,
  // `vercel env pull` provides VERCEL_OIDC_TOKEN for authenticated renders.
  return Boolean(
    process.env.VERCEL?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim(),
  )
}

export function getTbcConfig() {
  const apiKey = process.env.TBC_API_KEY?.trim()
  const clientId = process.env.TBC_CLIENT_ID?.trim()
  const clientSecret = process.env.TBC_CLIENT_SECRET?.trim()
  const baseUrl = (
    process.env.TBC_API_BASE_URL?.trim() || 'https://api.tbcbank.ge/v1'
  ).replace(/\/$/, '')
  const missing = [
    !apiKey && 'TBC_API_KEY',
    !clientId && 'TBC_CLIENT_ID',
    !clientSecret && 'TBC_CLIENT_SECRET',
  ].filter((value): value is string => Boolean(value))

  if (missing.length > 0) throw new FulfillmentConfigurationError(missing)
  if (!/^https:\/\/(api|test-api)\.tbcbank\.ge\/v\d+$/.test(baseUrl)) {
    throw new FulfillmentConfigurationError(['TBC_API_BASE_URL'])
  }

  return {
    apiKey: apiKey!,
    baseUrl,
    clientId: clientId!,
    clientSecret: clientSecret!,
  }
}

export function isTbcConfigured() {
  try {
    getTbcConfig()
    return true
  } catch {
    return false
  }
}

export function isCheckoutConfigured() {
  return isTbcConfigured() && isRemotionConfigured()
}
