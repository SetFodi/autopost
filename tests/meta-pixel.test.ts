import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  initializeMetaPixel,
  trackMetaFormStarted,
  trackMetaLeadOnce,
  trackMetaPageView,
} from '@/lib/analytics/meta-pixel'

describe('Meta Pixel utility', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890'
    localStorage.clear()
    document.head.innerHTML = ''
    delete window.fbq
    delete window._fbq
    delete window.__autoPostMetaPixelId
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
  })

  it('initializes the Pixel once and tracks each logical PageView', () => {
    expect(initializeMetaPixel()).toBe(true)
    expect(initializeMetaPixel()).toBe(true)
    expect(trackMetaPageView()).toBe(true)
    expect(trackMetaPageView()).toBe(true)

    const pageViews = window.fbq?.queue.filter(
      (call) => call[0] === 'track' && call[1] === 'PageView',
    )
    const initializations = window.fbq?.queue.filter(
      (call) => call[0] === 'init',
    )
    expect(pageViews).toHaveLength(2)
    expect(initializations).toHaveLength(1)
    expect(document.querySelectorAll('#autopost-meta-pixel')).toHaveLength(1)
  })

  it('queues the custom FormStarted event', () => {
    expect(trackMetaFormStarted()).toBe(true)
    expect(window.fbq?.queue).toContainEqual(['trackCustom', 'FormStarted'])
  })

  it('records Lead once per completed public reference', () => {
    expect(trackMetaLeadOnce('AP-1234567890')).toBe(true)
    expect(trackMetaLeadOnce('AP-1234567890')).toBe(false)

    const leads = window.fbq?.queue.filter(
      (call) => call[0] === 'track' && call[1] === 'Lead',
    )
    expect(leads).toHaveLength(1)
  })

  it('adds seller type to Lead custom data when available', () => {
    expect(trackMetaLeadOnce('AP-SELLER-TYPE', 'dealer')).toBe(true)
    expect(window.fbq?.queue).toContainEqual([
      'track',
      'Lead',
      {
        content_category: 'vehicle_preview',
        content_name: 'AutoPost for Cars',
        seller_type: 'dealer',
      },
    ])
  })

  it('is inert when no Pixel ID is configured', () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    expect(initializeMetaPixel()).toBe(false)
    expect(trackMetaPageView()).toBe(false)
    expect(trackMetaLeadOnce('AP-NO-PIXEL')).toBe(false)
    expect(window.fbq).toBeUndefined()
  })
})
