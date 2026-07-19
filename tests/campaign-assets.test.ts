import { describe, expect, it } from 'vitest'

import {
  realCampaignManifest,
  selectCampaignAssets,
} from '@/lib/campaign-assets'

describe('campaign asset selection', () => {
  it('uses the bundled showcase when real campaign media is not selected', () => {
    const selection = selectCampaignAssets({
      assetSet: 'showcase',
    })

    expect(selection.state).toBe('showcase')
    expect(selection.assets.kind).toBe('showcase')
    expect(selection.assets.heroBefore.src).toBe('/demo/hero-before-v3.webp')
    expect(selection.assets.heroAfter.src).toBe('/demo/hero-after-v3.webp')
  })

  it('falls back to the showcase for unset and legacy asset-set values', () => {
    const selection = selectCampaignAssets({
      assetSet: 'development',
    })

    expect(selection.state).toBe('showcase')
    expect(selection.assets.kind).toBe('showcase')
  })

  it('selects only the documented real campaign paths in production', () => {
    const selection = selectCampaignAssets({
      assetSet: 'real',
    })

    expect(selection.state).toBe('real')
    expect(selection.assets.kind).toBe('real')
    expect(selection.assets.heroBefore.src).toBe('/campaign/originals/01.jpg')
    expect(selection.assets.heroAfter.src).toBe(
      '/campaign/final/hero-after.jpg',
    )
    expect(selection.assets.reel.videoSrc).toBe('/campaign/final/reel.mp4')

    const allManifestPaths = JSON.stringify(realCampaignManifest)
    expect(allManifestPaths).not.toContain('/demo/')
    expect(realCampaignManifest.originals).toHaveLength(3)
    expect(realCampaignManifest.final.stories).toHaveLength(3)
    expect(realCampaignManifest.final.carousel).toHaveLength(6)
  })
})
