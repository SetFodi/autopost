import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifyAndRecordTbcPayment } from '@/lib/payments/verification'
import { readLimitedJson } from '@/lib/security/json'

export const runtime = 'nodejs'

const callbackSchema = z.object({ PaymentId: z.string().min(3).max(120) })
const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readLimitedJson(request, 4_096)
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }
  const parsed = callbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  try {
    await verifyAndRecordTbcPayment(parsed.data.PaymentId)
    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('[payments/tbc] callback verification failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}
