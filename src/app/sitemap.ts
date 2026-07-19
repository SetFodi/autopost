import type { MetadataRoute } from 'next'

import {
  MARKETING_CONTENT_UPDATED_AT,
  marketingGuides,
  publicMarketingPages,
} from '@/lib/marketing/content'
import { marketingGuidesEn } from '@/lib/marketing/content-en'
import { alternateMarketingPath } from '@/lib/i18n'
import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const lastModified = new Date(MARKETING_CONTENT_UPDATED_AT)

  const absoluteUrl = (path: string) => `${siteUrl}${path === '/' ? '' : path}`

  const staticPages = publicMarketingPages.map((path) => {
    const alternatePath = alternateMarketingPath(path)
    const english = path === '/en' || path.startsWith('/en/')
    const kaPath = english ? alternatePath : path
    const enPath = english ? path : alternatePath
    const legal = path.endsWith('/privacy') || path.endsWith('/terms')

    return {
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: legal
        ? ('yearly' as const)
        : path === '/' || path === '/en'
          ? ('weekly' as const)
          : ('monthly' as const),
      priority: legal
        ? 0.3
        : path === '/'
          ? 1
          : path === '/en' || path === '/examples'
            ? 0.9
            : 0.8,
      alternates: {
        languages: {
          'ka-GE': absoluteUrl(kaPath),
          en: absoluteUrl(enPath),
          'x-default': absoluteUrl(kaPath),
        },
      },
      images:
        path === '/' || path === '/en' || path.endsWith('/examples')
          ? [
              `${siteUrl}/demo/hero-before-v3.webp`,
              `${siteUrl}/demo/hero-after-v3.webp`,
            ]
          : undefined,
    }
  })

  const guidePages = marketingGuides.flatMap((guide, index) => {
    const englishGuide = marketingGuidesEn[index]
    if (!englishGuide) return []
    const kaPath = `/guides/${guide.slug}`
    const enPath = `/en/guides/${englishGuide.slug}`
    const alternates = {
      languages: {
        'ka-GE': absoluteUrl(kaPath),
        en: absoluteUrl(enPath),
        'x-default': absoluteUrl(kaPath),
      },
    }

    return [kaPath, enPath].map((path) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      alternates,
    }))
  })

  return [...staticPages, ...guidePages]
}
