import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ResultExperience } from '@/components/results/result-experience'
import { getResultSnapshot } from '@/lib/fulfillment/result-snapshot'
import { verifyResultToken } from '@/lib/fulfillment/result-token'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'თქვენი შედეგი · AutoPost',
  description: 'AutoPost-ის პირადი Preview და publish-ready პაკეტი.',
  robots: { follow: false, index: false },
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const [{ token }, query] = await Promise.all([params, searchParams])
  const submissionId = verifyResultToken(token)
  if (!submissionId) notFound()
  const snapshot = await getResultSnapshot(submissionId)
  if (!snapshot) notFound()

  return (
    <ResultExperience
      initialSnapshot={snapshot}
      token={token}
      paymentReturn={query.payment === 'return'}
    />
  )
}
