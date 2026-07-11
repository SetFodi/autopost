'use client'

import { useActionState } from 'react'
import { KeyRound, Mail } from 'lucide-react'

import { loginAction } from '@/app/admin/actions'
import { PendingButton } from '@/components/admin/pending-button'
import type { AdminActionState } from '@/lib/admin/types'

const INITIAL_STATE: AdminActionState = { kind: 'idle', message: '' }

export function LoginForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE)

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="admin-email"
          className="text-sm font-semibold text-stone-200"
        >
          ელფოსტა
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500"
          />
          <input
            id="admin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={disabled}
            placeholder="admin@example.com"
            className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 pr-4 pl-11 text-base text-stone-100 transition outline-none placeholder:text-stone-600 focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="admin-password"
          className="text-sm font-semibold text-stone-200"
        >
          პაროლი
        </label>
        <div className="relative">
          <KeyRound
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500"
          />
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={disabled}
            className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 pr-4 pl-11 text-base text-stone-100 transition outline-none focus:border-orange-400/70 focus:ring-4 focus:ring-orange-400/10 disabled:opacity-50"
          />
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="min-h-6">
        {state.message ? (
          <p
            className={`text-sm ${
              state.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <PendingButton
        disabled={disabled}
        pendingLabel="მოწმდება…"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
      >
        ადმინისტრაციაში შესვლა
      </PendingButton>
    </form>
  )
}
