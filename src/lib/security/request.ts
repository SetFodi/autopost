import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

const HASH_VERSION = 'v1'
const MINIMUM_HASH_SECRET_LENGTH = 32
const HASHED_TOKEN_PATTERN = /^v1:[a-f0-9]{64}$/

export class SecurityConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityConfigurationError'
  }
}

function getHashSecret(): string {
  const secret = process.env.RATE_LIMIT_IP_HASH_SECRET?.trim()

  if (!secret || secret.length < MINIMUM_HASH_SECRET_LENGTH) {
    throw new SecurityConfigurationError(
      'RATE_LIMIT_IP_HASH_SECRET must contain at least 32 characters.',
    )
  }

  return secret
}

function firstValidIp(headerValue: string | null): string | null {
  if (!headerValue) return null

  for (const candidate of headerValue.split(',')) {
    const value = candidate.trim()
    if (isIP(value)) return value
  }

  return null
}

/**
 * Vercel overwrites these headers before invoking the function, preventing a
 * browser from choosing another user's rate-limit key. Local/self-hosted use
 * must place the app behind a trusted proxy that also overwrites them.
 */
export function getClientIp(request: Request): string {
  const candidates = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  ]

  for (const candidate of candidates) {
    const ip = firstValidIp(candidate)
    if (ip) return ip
  }

  return 'unknown'
}

function hmacHash(namespace: string, value: string): string {
  const digest = createHmac('sha256', getHashSecret())
    .update(`${namespace}\0${value}`)
    .digest('hex')

  return `${HASH_VERSION}:${digest}`
}

export function hashClientIp(request: Request): string {
  return hmacHash('client-ip', getClientIp(request))
}

export function hashIdempotencyKey(key: string): string {
  return hmacHash('submission-idempotency', key)
}

export function fingerprintSubmissionPayload(payload: unknown): string {
  return hmacHash('submission-payload', JSON.stringify(payload))
}

export function createSubmissionCompletionToken(submissionId: string): string {
  return hmacHash('submission-completion', submissionId)
}

export function verifySubmissionCompletionToken(
  submissionId: string,
  token: string,
): boolean {
  if (!HASHED_TOKEN_PATTERN.test(token)) return false

  const expected = createSubmissionCompletionToken(submissionId)
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback
}

export function getSubmissionRateLimitConfig() {
  const limit = boundedInteger(process.env.SUBMISSION_RATE_LIMIT_MAX, 3, 1, 100)
  const configuredRequestLimit = boundedInteger(
    process.env.SUBMISSION_INIT_REQUEST_RATE_LIMIT_MAX,
    30,
    2,
    1000,
  )

  return {
    limit,
    // Replays and conflicts consume this broader scope. Keep it at least one
    // slot looser than the new-submission limit, even after bad env input.
    requestLimit: Math.max(configuredRequestLimit, limit + 1),
    windowSeconds:
      boundedInteger(
        process.env.SUBMISSION_RATE_LIMIT_WINDOW_MINUTES,
        60,
        1,
        1440,
      ) * 60,
  }
}

export const PUBLIC_ANALYTICS_RATE_LIMIT = {
  limit: 120,
  windowSeconds: 60 * 60,
} as const
