import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ResultExperience } from '@/components/results/result-experience'
import { getResultSnapshot } from '@/lib/fulfillment/result-snapshot'
import { verifyResultToken } from '@/lib/fulfillment/result-token'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}): Promise<Metadata> {
  const { lang } = await searchParams
  const english = lang === 'en'
  return {
    title: english
      ? 'Your private results · AutoPost'
      : 'თქვენი შედეგი · AutoPost',
    description: english
      ? 'Your private AutoPost preview and publish-ready content package.'
      : 'AutoPost-ის პირადი Preview და publish-ready პაკეტი.',
    robots: { follow: false, index: false },
  }
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string; lang?: string }>
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
      locale={query.lang === 'en' ? 'en' : 'ka'}
    />
  )
}
