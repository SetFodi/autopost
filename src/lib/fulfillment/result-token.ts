import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { getResultTokenSecret } from '@/lib/fulfillment/config'
import { getSiteUrl } from '@/lib/site-url'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function signature(payload: string) {
  return createHmac('sha256', getResultTokenSecret())
    .update(`autopost-result:v1:${payload}`)
    .digest('base64url')
}

export function createResultToken(submissionId: string) {
  if (!UUID_PATTERN.test(submissionId)) throw new Error('Invalid submission id')
  const payload = Buffer.from(submissionId.toLowerCase(), 'utf8').toString(
    'base64url',
  )
  return `${payload}.${signature(payload)}`
}

export function verifyResultToken(token: string) {
  const [payload, suppliedSignature, extra] = token.split('.')
  if (!payload || !suppliedSignature || extra) return null

  const expectedSignature = signature(payload)
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null
  }

  try {
    const submissionId = Buffer.from(payload, 'base64url').toString('utf8')
    return UUID_PATTERN.test(submissionId) ? submissionId.toLowerCase() : null
  } catch {
    return null
  }
}

export function getResultUrl(submissionId: string) {
  return new URL(`/result/${createResultToken(submissionId)}`, getSiteUrl())
}
