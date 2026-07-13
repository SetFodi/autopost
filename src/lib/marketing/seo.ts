import type { Metadata } from 'next'

type MarketingMetadataInput = {
  title: string
  description: string
  path: string
}

export function createMarketingMetadata({
  title,
  description,
  path,
}: MarketingMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'ka_GE',
      url: path,
      siteName: 'AutoPost',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
