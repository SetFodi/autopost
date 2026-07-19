import type { MetadataRoute } from 'next'

import {
  MARKETING_CONTENT_UPDATED_AT,
  marketingGuides,
  publicMarketingPages,
} from '@/lib/marketing/content'
import { getSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const lastModified = new Date(MARKETING_CONTENT_UPDATED_AT)

  return [
    ...publicMarketingPages.map((path) => ({
      url: `${siteUrl}${path === '/' ? '' : path}`,
      lastModified,
      changeFrequency:
        path === '/' || path === '/en'
          ? ('weekly' as const)
          : ('monthly' as const),
      priority:
        path === '/' ? 1 : path === '/en' || path === '/examples' ? 0.9 : 0.8,
    })),
    ...marketingGuides.map((guide) => ({
      url: `${siteUrl}/guides/${guide.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date('2026-07-11'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date('2026-07-11'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
