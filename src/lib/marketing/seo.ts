import type { Metadata } from 'next'

import { alternateMarketingPath, type AppLocale } from '@/lib/i18n'

type MarketingMetadataInput = {
  title: string
  description: string
  path: string
  locale?: AppLocale
  alternatePath?: string
  type?: 'website' | 'article'
}

export function createMarketingMetadata({
  title,
  description,
  path,
  locale = 'ka',
  alternatePath = alternateMarketingPath(path),
  type = 'website',
}: MarketingMetadataInput): Metadata {
  const english = locale === 'en'
  const kaPath = english ? alternatePath : path
  const enPath = english ? path : alternatePath

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { 'ka-GE': kaPath, en: enPath, 'x-default': kaPath },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type,
      locale: english ? 'en_US' : 'ka_GE',
      alternateLocale: [english ? 'ka_GE' : 'en_US'],
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
