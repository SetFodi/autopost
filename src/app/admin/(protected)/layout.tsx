import Link from 'next/link'
import type { ReactNode } from 'react'
import { CarFront, LogOut } from 'lucide-react'

import { signOutAction } from '@/app/admin/actions'
import { PendingButton } from '@/components/admin/pending-button'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0c0d0d]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center gap-3 rounded-xl pr-2 focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-black">
              <CarFront aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight text-stone-100">
                AutoPost
              </span>
              <span className="block text-[10px] font-bold tracking-[0.14em] text-stone-600 uppercase">
                Fulfillment desk
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden max-w-56 truncate font-mono text-xs text-stone-600 sm:block">
              {admin.email}
            </p>
            <form action={signOutAction}>
              <PendingButton
                pendingLabel="გამოსვლა…"
                aria-label="ადმინისტრაციიდან გამოსვლა"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-stone-400 transition hover:border-rose-400/20 hover:bg-rose-400/5 hover:text-rose-200 focus-visible:outline-2 focus-visible:outline-orange-400"
              >
                <LogOut aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">გამოსვლა</span>
              </PendingButton>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
