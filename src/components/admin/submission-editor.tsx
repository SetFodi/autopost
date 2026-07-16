'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'

import { updateSubmissionAction } from '@/app/admin/actions'
import { PendingButton } from '@/components/admin/pending-button'
import { STATUS_DETAILS } from '@/lib/admin/constants'
import {
  SUBMISSION_STATUSES,
  type AdminActionState,
  type AdminSubmissionDetail,
} from '@/lib/admin/types'

const INITIAL_STATE: AdminActionState = { kind: 'idle', message: '' }

type SubmissionEditorProps = {
  submission: Pick<
    AdminSubmissionDetail,
    'id' | 'status' | 'internal_notes' | 'delivery_url' | 'amount_paid'
  >
}

export function SubmissionEditor({ submission }: SubmissionEditorProps) {
  const [state, formAction] = useActionState(
    updateSubmissionAction,
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={submission.id} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="submission-status"
            className="text-sm font-bold text-stone-200"
          >
            მიმდინარე სტატუსი
          </label>
          <select
            id="submission-status"
            name="status"
            defaultValue={submission.status}
            className="min-h-12 w-full rounded-xl border border-white/10 bg-[#111212] px-4 text-sm text-stone-100 outline-none focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
          >
            {SUBMISSION_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
                disabled={
                  status === 'converted' &&
                  submission.status !== 'delivered' &&
                  submission.status !== 'converted'
                }
              >
                {STATUS_DETAILS[status].label} —{' '}
                {STATUS_DETAILS[status].description}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="amount-paid"
            className="text-sm font-bold text-stone-200"
          >
            მიღებული თანხა
          </label>
          <div className="relative">
            <input
              id="amount-paid"
              name="amountPaid"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              inputMode="decimal"
              defaultValue={String(submission.amount_paid ?? 0)}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 pr-11 text-sm text-stone-100 outline-none focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-stone-500">
              ₾
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="internal-notes"
          className="text-sm font-bold text-stone-200"
        >
          შიდა შენიშვნები
        </label>
        <textarea
          id="internal-notes"
          name="internalNotes"
          rows={5}
          maxLength={5_000}
          defaultValue={submission.internal_notes ?? ''}
          placeholder="ფოტოების ხარისხი, მომხმარებლის მოთხოვნა, შემდგომი ნაბიჯი…"
          className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-100 outline-none placeholder:text-stone-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
        />
        <p className="text-xs text-stone-600">
          ეს ტექსტი მხოლოდ ადმინისტრაციაში ჩანს.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="editor-delivery-url"
          className="text-sm font-bold text-stone-200"
        >
          Drive / Preview ბმული
        </label>
        <input
          id="editor-delivery-url"
          name="deliveryUrl"
          type="url"
          maxLength={2_000}
          defaultValue={submission.delivery_url ?? ''}
          placeholder="https://drive.google.com/..."
          className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-orange-400/60 focus:ring-4 focus:ring-orange-400/10"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" aria-atomic="true" className="min-h-5">
          {state.message ? (
            <p
              className={`text-sm ${state.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}
            >
              {state.message}
            </p>
          ) : null}
        </div>
        <PendingButton
          pendingLabel="ინახება…"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-black transition hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <Save aria-hidden="true" className="size-4" />
          ცვლილებების შენახვა
        </PendingButton>
      </div>
    </form>
  )
}
