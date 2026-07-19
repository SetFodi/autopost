'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { trackInternalEvent } from '@/lib/analytics/client'
import { localizedSection, type AppLocale } from '@/lib/i18n'

interface TrackedCtaProps {
  source: string
  className?: string
  compact?: boolean
  locale?: AppLocale
}

export function TrackedCta({
  source,
  className = '',
  compact = false,
  locale = 'ka',
}: TrackedCtaProps) {
  const label = locale === 'en' ? 'Get a free preview' : 'მიიღე უფასო Preview'
  const shortLabel = locale === 'en' ? 'Free preview' : 'უფასო Preview'

  return (
    <Link
      href={localizedSection(locale, 'preview-form')}
      className={`cta-primary group ${className}`}
      onClick={() => {
        trackInternalEvent('primary_cta_click', {
          metadata: { source, locale },
        })
      }}
    >
      {compact ? (
        <>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  )
}
