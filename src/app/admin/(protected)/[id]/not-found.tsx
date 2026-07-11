import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

export default function SubmissionNotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-12 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <FileQuestion aria-hidden="true" className="size-7 text-stone-600" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-stone-100">
          განაცხადი ვერ მოიძებნა
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          ჩანაწერი არ არსებობს ან ფოტოებით ატვირთვა ჯერ არ დასრულებულა.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-100 px-5 text-sm font-bold text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          განაცხადებზე დაბრუნება
        </Link>
      </div>
    </main>
  )
}
