import { LoaderCircle } from 'lucide-react'

export function ResultEmptyOutput({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <LoaderCircle
          className="text-amber/70 mx-auto size-7 animate-spin"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-bold">{label} მზადდება</p>
        <p className="text-ivory/35 mt-2 text-xs">
          აქ ავტომატურად გამოჩნდება დასრულებისთანავე.
        </p>
      </div>
    </div>
  )
}
