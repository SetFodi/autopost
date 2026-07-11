'use client'

import type { ReactNode } from 'react'

import { trackInternalEvent } from '@/lib/analytics/client'

interface TrackedWhatsappLinkProps {
  href: string
  source: string
  className?: string
  children: ReactNode
}

export function TrackedWhatsappLink({
  href,
  source,
  className = '',
  children,
}: TrackedWhatsappLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        trackInternalEvent('whatsapp_clicked', {
          metadata: { source },
        })
      }}
    >
      {children}
    </a>
  )
}
