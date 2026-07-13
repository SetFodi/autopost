'use client'

import { useEffect } from 'react'

import { trackInternalEvent } from '@/lib/analytics/client'
import { trackMetaPageView } from '@/lib/analytics/meta-pixel'

export function MarketingPageAnalytics({ path }: { path: string }) {
  useEffect(() => {
    trackMetaPageView()
    void trackInternalEvent('landing_view', {
      metadata: { path },
    })
  }, [path])

  return null
}
