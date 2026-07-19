import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { localizedHome, type AppLocale } from '@/lib/i18n'

export function MarketingHero({
  index,
  eyebrow,
  title,
  accent,
  description,
  locale = 'ka',
  children,
}: {
  index: string
  eyebrow: string
  title: string
  accent?: string
  description: string
  locale?: AppLocale
  children?: React.ReactNode
}) {
  return (
    <section className="grain relative overflow-hidden border-b border-white/[0.07] py-14 sm:py-20 lg:py-24">
      <div className="bg-amber/[0.045] pointer-events-none absolute -top-52 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-[130px]" />
      <div className="site-container relative">
        <Link
          href={localizedHome(locale)}
          className="text-ivory/45 hover:text-amber inline-flex items-center gap-2 text-xs font-bold transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />{' '}
          {locale === 'en' ? 'Home' : 'მთავარი'}
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-end">
          <div>
            <p className="section-kicker">
              {index} · {eyebrow}
            </p>
            <h1 className="font-display text-ivory max-w-5xl text-[clamp(2.55rem,7vw,6.4rem)] leading-[0.98] font-extrabold tracking-[-0.065em] [overflow-wrap:anywhere]">
              {title}{' '}
              {accent ? <span className="text-amber">{accent}</span> : null}
            </h1>
          </div>
          <div className="border-amber/35 lg:border-l lg:pl-7">
            <p className="text-ivory/58 text-sm leading-7 sm:text-base sm:leading-8">
              {description}
            </p>
            {children ? <div className="mt-5">{children}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
