import { NextResponse } from 'next/server'

import { getResultSnapshot } from '@/lib/fulfillment/result-snapshot'
import { verifyResultToken } from '@/lib/fulfillment/result-token'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(
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
  const snapshot = await getResultSnapshot(submissionId)
  if (!snapshot) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: NO_STORE_HEADERS },
    )
  }
  return NextResponse.json(snapshot, { headers: NO_STORE_HEADERS })
}
