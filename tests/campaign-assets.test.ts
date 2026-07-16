import { describe, expect, it } from 'vitest'

import {
  realCampaignManifest,
  selectCampaignAssets,
} from '@/lib/campaign-assets'

describe('campaign asset selection', () => {
  it('uses demo media only outside production', () => {
    const selection = selectCampaignAssets({
      assetSet: 'development',
      environment: 'development',
    })

    expect(selection.state).toBe('development-fallback')
    expect(selection.assets?.kind).toBe('development')
    expect(selection.assets?.heroBefore.src).toContain('/demo/')
  })

  it('blocks production instead of rendering demo media', () => {
    const selection = selectCampaignAssets({
      assetSet: 'development',
      environment: 'production',
    })

    expect(selection).toEqual({ state: 'blocked', assets: null })
  })

  it('selects only the documented real campaign paths in production', () => {
    const selection = selectCampaignAssets({
      assetSet: 'real',
      environment: 'production',
    })

    expect(selection.state).toBe('real')
    expect(selection.assets?.kind).toBe('real')
    expect(selection.assets?.heroBefore.src).toBe('/campaign/originals/01.jpg')
    expect(selection.assets?.heroAfter.src).toBe(
      '/campaign/final/hero-after.jpg',
    )
    expect(selection.assets?.reel.videoSrc).toBe('/campaign/final/reel.mp4')

    const allManifestPaths = JSON.stringify(realCampaignManifest)
    expect(allManifestPaths).not.toContain('/demo/')
    expect(realCampaignManifest.originals).toHaveLength(3)
    expect(realCampaignManifest.final.stories).toHaveLength(3)
    expect(realCampaignManifest.final.carousel).toHaveLength(6)
  })
})
