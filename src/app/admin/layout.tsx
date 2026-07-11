import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'ადმინისტრაცია · AutoPost',
    template: '%s · AutoPost Admin',
  },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0d0d] text-stone-100 selection:bg-orange-400 selection:text-black">
      {children}
    </div>
  )
}
