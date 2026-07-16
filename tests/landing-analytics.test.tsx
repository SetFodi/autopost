import { StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const analyticsMocks = vi.hoisted(() => ({
  captureCampaignAttribution: vi.fn(),
  trackInternalEvent: vi.fn(),
  trackMetaPageView: vi.fn(),
}))

vi.mock('@/lib/analytics/attribution', () => ({
  captureCampaignAttribution: analyticsMocks.captureCampaignAttribution,
}))
vi.mock('@/lib/analytics/client', () => ({
  trackInternalEvent: analyticsMocks.trackInternalEvent,
}))
vi.mock('@/lib/analytics/meta-pixel', () => ({
  trackMetaPageView: analyticsMocks.trackMetaPageView,
}))

import { LandingAnalytics } from '@/components/landing/landing-analytics'

describe('LandingAnalytics', () => {
  beforeEach(() => {
    analyticsMocks.captureCampaignAttribution.mockReset()
    analyticsMocks.trackInternalEvent.mockReset()
    analyticsMocks.trackMetaPageView.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('tracks once per logical mount, including under React Strict Mode', () => {
    const firstMount = render(
      <StrictMode>
        <LandingAnalytics />
      </StrictMode>,
    )

    expect(analyticsMocks.captureCampaignAttribution).toHaveBeenCalledTimes(1)
    expect(analyticsMocks.trackMetaPageView).toHaveBeenCalledTimes(1)
    expect(analyticsMocks.trackInternalEvent).toHaveBeenCalledTimes(1)
    expect(analyticsMocks.trackInternalEvent).toHaveBeenCalledWith(
      'landing_view',
      {
        metadata: { path: '/' },
      },
    )

    firstMount.unmount()

    render(<LandingAnalytics />)

    expect(analyticsMocks.captureCampaignAttribution).toHaveBeenCalledTimes(2)
    expect(analyticsMocks.trackMetaPageView).toHaveBeenCalledTimes(2)
    expect(analyticsMocks.trackInternalEvent).toHaveBeenCalledTimes(2)
  })
})
