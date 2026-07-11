'use client'

import { useEffect } from 'react'

import { trackInternalEvent } from '@/lib/analytics/client'
import { initializeMetaPixel } from '@/lib/analytics/meta-pixel'

export function LandingAnalytics() {
  useEffect(() => {
    initializeMetaPixel()
    trackInternalEvent('landing_view', {
      metadata: { path: '/' },
    })
  }, [])

  return null
}
