'use client'

import { useActionState, useRef, useState } from 'react'
import { LoaderCircle, Trash2, TriangleAlert, X } from 'lucide-react'

import { deleteSubmissionAction } from '@/app/admin/delete-actions'
import type { DeleteSubmissionActionState } from '@/lib/admin/delete-submission'

const INITIAL_STATE: DeleteSubmissionActionState = {
  kind: 'idle',
  message: '',
  storageRemoved: false,
}

type DeleteSubmissionControlProps = {
  submissionId: string
  publicReference: string
}

export function DeleteSubmissionControl({
  submissionId,
  publicReference,
}: DeleteSubmissionControlProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmation, setConfirmation] = useState('')
  const [state, formAction, pending] = useActionState(
    deleteSubmissionAction,
    INITIAL_STATE,
  )
  const confirmed = confirmation.trim() === publicReference

  function closeDialog() {
    if (pending) return
    dialogRef.current?.close()
    setConfirmation('')
  }

  return (
    <section className="rounded-3xl border border-rose-400/15 bg-rose-400/[0.035] p-4 sm:p-6">
      <p className="text-xs font-bold tracking-[0.16em] text-rose-300 uppercase">
        Danger zone
      </p>
      <h2 className="mt-1 text-sm font-black text-stone-100">
        განაცხადის შეუქცევადად წაშლა
      </h2>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        იშლება პირადი ფოტოები, საკონტაქტო მონაცემები და განაცხადის ჩანაწერი.
        მოქმედების გაუქმება შეუძლებელია.
      </p>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/8 px-4 text-xs font-bold text-rose-200 transition hover:bg-rose-400/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        წაშლის დაწყება
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-submission-title"
        aria-describedby="delete-submission-description"
        onCancel={(event) => {
          if (pending) event.preventDefault()
        }}
        onClose={() => setConfirmation('')}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl border border-rose-400/20 bg-[#171414] p-0 text-stone-100 shadow-[0_32px_120px_rgba(0,0,0,0.75)] backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="p-5 sm:p-7">
          <input type="hidden" name="id" value={submissionId} />

          <div className="flex items-start justify-between gap-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <TriangleAlert aria-hidden="true" className="size-5" />
            </span>
            <button
              type="button"
              aria-label="დადასტურების ფანჯრის დახურვა"
              disabled={pending}
              onClick={closeDialog}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-white/5 hover:text-stone-200 focus-visible:outline-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <h3
            id="delete-submission-title"
            className="mt-5 text-xl font-black text-stone-100"
          >
            ნამდვილად წავშალოთ განაცხადი?
          </h3>
          <p
            id="delete-submission-description"
            className="mt-2 text-sm leading-6 text-stone-400"
          >
            ჯერ ყველა პირადი ფოტო წაიშლება დახურული Storage-იდან, შემდეგ კი
            განაცხადისა და ფაილების მონაცემთა ჩანაწერები. ეს მოქმედება
            შეუქცევადია.
          </p>

          <label
            htmlFor="delete-submission-confirmation"
            className="mt-5 block text-sm font-bold text-stone-200"
          >
            დასადასტურებლად შეიყვანეთ{' '}
            <span className="font-mono text-rose-300">{publicReference}</span>
          </label>
          <input
            id="delete-submission-confirmation"
            name="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm text-stone-100 outline-none placeholder:text-stone-700 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={publicReference}
          />

          <div aria-live="polite" aria-atomic="true" className="mt-4 min-h-6">
            {state.message ? (
              <p
                role="alert"
                className={`rounded-xl border px-3 py-2 text-xs leading-5 ${
                  state.storageRemoved
                    ? 'border-amber-400/20 bg-amber-400/8 text-amber-100'
                    : 'border-rose-400/20 bg-rose-400/8 text-rose-200'
                }`}
              >
                {state.message}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={closeDialog}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-bold text-stone-300 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={!confirmed || pending}
              aria-disabled={!confirmed || pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-black text-white transition hover:bg-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  იშლება…
                </>
              ) : (
                <>
                  <Trash2 aria-hidden="true" className="size-4" />
                  შეუქცევადად წაშლა
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
