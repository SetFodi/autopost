'use client'

import { RotateCcw, TriangleAlert } from 'lucide-react'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-12 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-rose-400/15 bg-rose-400/8">
          <TriangleAlert aria-hidden="true" className="size-7 text-rose-300" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-stone-100">
          მონაცემები ვერ ჩაიტვირთა
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          გადაამოწმეთ Supabase-ის კონფიგურაცია და ქსელი, შემდეგ სცადეთ თავიდან.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-100 px-5 text-sm font-bold text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          ხელახლა ცდა
        </button>
      </div>
    </main>
  )
}
