import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import {
  frequentlyAskedQuestions,
  getMarketingGuide,
  marketingGuides,
  publicMarketingPages,
} from '@/lib/marketing/content'
import { marketingGuidesEn } from '@/lib/marketing/content-en'
import { createMarketingMetadata } from '@/lib/marketing/seo'

describe('public marketing content', () => {
  it('ships a focused set of unique, substantial Georgian guides', () => {
    expect(marketingGuides).toHaveLength(3)
    expect(new Set(marketingGuides.map((guide) => guide.slug)).size).toBe(
      marketingGuides.length,
    )

    for (const guide of marketingGuides) {
      expect(guide.title.length).toBeGreaterThan(20)
      expect(guide.description.length).toBeGreaterThan(60)
      expect(guide.sections.length).toBeGreaterThanOrEqual(6)
      expect(getMarketingGuide(guide.slug)).toBe(guide)
    }
  })

  it('ships equivalent original English guides with search-friendly slugs', () => {
    expect(marketingGuidesEn).toHaveLength(marketingGuides.length)
    expect(new Set(marketingGuidesEn.map((guide) => guide.slug)).size).toBe(
      marketingGuidesEn.length,
    )

    for (const guide of marketingGuidesEn) {
      expect(guide.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(guide.title.length).toBeGreaterThan(20)
      expect(guide.description.length).toBeGreaterThan(60)
      expect(guide.sections.length).toBeGreaterThanOrEqual(6)
    }
  })

  it('keeps FAQ answers visible and useful', () => {
    expect(frequentlyAskedQuestions.length).toBeGreaterThanOrEqual(8)
    expect(
      frequentlyAskedQuestions.every(
        (item) => item.question.length > 10 && item.answer.length > 60,
      ),
    ).toBe(true)
  })

  it('includes every public page and guide in the sitemap exactly once', () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname)
    const expected = [
      ...publicMarketingPages,
      ...marketingGuides.map((guide) => `/guides/${guide.slug}`),
      ...marketingGuidesEn.map((guide) => `/en/guides/${guide.slug}`),
    ]

    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.sort()).toEqual([...expected].sort())
  })

  it('connects every indexed page to Georgian and English alternates', () => {
    for (const entry of sitemap()) {
      const languages = entry.alternates?.languages
      expect(languages?.['ka-GE']).toMatch(/^https?:\/\//)
      expect(languages?.en).toMatch(/^https?:\/\//)
      expect(languages?.['x-default']).toBe(languages?.['ka-GE'])
    }
  })

  it('creates reciprocal localized metadata for both languages', () => {
    const georgian = createMarketingMetadata({
      title: 'ქართული გვერდი',
      description: 'ქართული აღწერა',
      path: '/pricing',
    })
    const english = createMarketingMetadata({
      title: 'English page',
      description: 'English description',
      path: '/en/pricing',
      locale: 'en',
    })

    expect(georgian.alternates).toMatchObject({
      canonical: '/pricing',
      languages: { 'ka-GE': '/pricing', en: '/en/pricing' },
    })
    expect(english.alternates).toMatchObject({
      canonical: '/en/pricing',
      languages: { 'ka-GE': '/pricing', en: '/en/pricing' },
    })
    expect(english.openGraph).toMatchObject({
      locale: 'en_US',
      alternateLocale: ['ka_GE'],
    })
  })
})
