'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { trackInternalEvent } from '@/lib/analytics/client'

interface TrackedCtaProps {
  source: string
  className?: string
}

export function TrackedCta({ source, className = '' }: TrackedCtaProps) {
  return (
    <Link
      href="/#preview-form"
      className={`cta-primary group ${className}`}
      onClick={() => {
        trackInternalEvent('primary_cta_click', {
          metadata: { source },
        })
      }}
    >
      <span>მიიღე უფასო Preview</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  )
}
