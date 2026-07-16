import { beforeEach, describe, expect, it } from 'vitest'

import {
  captureCampaignAttribution,
  getCampaignAttribution,
} from '@/lib/analytics/attribution'

function setSearch(search = '') {
  window.history.replaceState({}, '', `/${search}`)
}

describe('campaign attribution', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setSearch()
  })

  it('captures supported UTM parameters using stable camelCase fields', () => {
    setSearch(
      '?utm_source=facebook&utm_medium=paid_social&utm_campaign=july-cars&utm_content=reel-a&utm_term=used%20cars&ignored=value',
    )

    expect(captureCampaignAttribution()).toEqual({
      utmSource: 'facebook',
      utmMedium: 'paid_social',
      utmCampaign: 'july-cars',
      utmContent: 'reel-a',
      utmTerm: 'used cars',
    })
    expect(getCampaignAttribution()).toEqual({
      utmSource: 'facebook',
      utmMedium: 'paid_social',
      utmCampaign: 'july-cars',
      utmContent: 'reel-a',
      utmTerm: 'used cars',
    })
  })

  it('sanitizes control characters, whitespace, Unicode and length', () => {
    const longCampaign = `  ივლისი\u0000\n\t ${'x'.repeat(240)}  `
    setSearch(`?utm_campaign=${encodeURIComponent(longCampaign)}`)

    const attribution = captureCampaignAttribution()

    expect(attribution.utmCampaign).toMatch(/^ივლისი x+$/)
    expect(attribution.utmCampaign).toHaveLength(200)
  })

  it('preserves stored attribution across untagged hash navigation', () => {
    setSearch('?utm_source=instagram&utm_campaign=story-test')
    captureCampaignAttribution()

    setSearch('#preview-form')

    expect(captureCampaignAttribution()).toEqual({
      utmSource: 'instagram',
      utmCampaign: 'story-test',
    })
  })

  it('replaces an earlier campaign when a new tagged landing is captured', () => {
    setSearch('?utm_source=facebook&utm_campaign=first')
    captureCampaignAttribution()

    setSearch('?utm_source=instagram&utm_content=second-story')

    expect(captureCampaignAttribution()).toEqual({
      utmSource: 'instagram',
      utmContent: 'second-story',
    })
    expect(getCampaignAttribution()).toEqual({
      utmSource: 'instagram',
      utmContent: 'second-story',
    })
  })

  it('ignores malformed persisted data without interrupting the flow', () => {
    sessionStorage.setItem('autopost:campaign-attribution', '{broken')

    expect(getCampaignAttribution()).toEqual({})
    expect(captureCampaignAttribution()).toEqual({})
  })
})
