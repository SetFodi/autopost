import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import {
  frequentlyAskedQuestions,
  getMarketingGuide,
  marketingGuides,
  publicMarketingPages,
} from '@/lib/marketing/content'

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
      '/privacy',
      '/terms',
    ]

    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.sort()).toEqual([...expected].sort())
  })
})
