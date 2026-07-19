import { LoaderCircle } from 'lucide-react'
import type { AppLocale } from '@/lib/i18n'

export function ResultEmptyOutput({
  label,
  locale = 'ka',
}: {
  label: string
  locale?: AppLocale
}) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <LoaderCircle
          className="text-amber/70 mx-auto size-7 animate-spin"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-bold">
          {locale === 'en' ? `${label} is processing` : `${label} მზადდება`}
        </p>
        <p className="text-ivory/35 mt-2 text-xs">
          {locale === 'en'
            ? 'It will appear here automatically when complete.'
            : 'აქ ავტომატურად გამოჩნდება დასრულებისთანავე.'}
        </p>
      </div>
    </div>
  )
}
