'use client'

import { useEffect, useRef } from 'react'

import { captureCampaignAttribution } from '@/lib/analytics/attribution'
import { trackInternalEvent } from '@/lib/analytics/client'
import { trackMetaPageView } from '@/lib/analytics/meta-pixel'

export function LandingAnalytics({ path = '/' }: { path?: '/' | '/en' }) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true

    captureCampaignAttribution()
    trackMetaPageView()
    trackInternalEvent('landing_view', {
      metadata: { path },
    })
  }, [path])

  return null
}
