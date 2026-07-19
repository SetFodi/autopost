import Link from 'next/link'

import { TrackedCta } from '@/components/landing/tracked-cta'
import {
  localizedHome,
  localizedMarketingPath,
  type AppLocale,
} from '@/lib/i18n'

export function SiteHeader({
  locale = 'ka',
  languageHref,
}: {
  locale?: AppLocale
  languageHref?: string
}) {
  const english = locale === 'en'
  const home = localizedHome(locale)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0c0b0a]/85 backdrop-blur-xl">
      <div className="site-container flex h-[68px] items-center justify-between gap-3 md:h-[72px]">
        <Link
          href={home}
          className="group flex min-w-0 items-center gap-2.5 focus-visible:outline-none"
          aria-label={english ? 'AutoPost — home' : 'AutoPost — მთავარი გვერდი'}
        >
          <span className="brand-mark">AP</span>
          <span className="brand-word text-ivory text-base font-extrabold tracking-[-0.04em] sm:text-lg">
            AutoPost
          </span>
        </Link>

        <nav
          aria-label={english ? 'Main navigation' : 'მთავარი ნავიგაცია'}
          className="text-ivory/55 hidden items-center gap-8 text-[13px] font-medium lg:flex"
        >
          <Link
            className="nav-link"
            href={localizedMarketingPath(locale, 'examples')}
          >
            {english ? 'Examples' : 'მაგალითები'}
          </Link>
          <Link
            className="nav-link"
            href={localizedMarketingPath(locale, 'howItWorks')}
          >
            {english ? 'How it works' : 'როგორ მუშაობს'}
          </Link>
          <Link
            className="nav-link"
            href={localizedMarketingPath(locale, 'pricing')}
          >
            {english ? 'Pricing' : 'ფასი'}
          </Link>
          <Link
            className="nav-link"
            href={localizedMarketingPath(locale, 'guides')}
          >
            {english ? 'Guides' : 'გზამკვლევები'}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={languageHref ?? (english ? '/' : '/en')}
            hrefLang={english ? 'ka' : 'en'}
            lang={english ? 'ka' : 'en'}
            className="text-ivory/62 hover:border-amber/50 hover:text-amber grid min-h-10 min-w-10 place-items-center border border-white/12 px-2 font-mono text-[10px] font-semibold tracking-[0.12em] transition-colors sm:min-h-11"
            aria-label={
              english ? 'ქართული ვერსიის გახსნა' : 'Open English version'
            }
          >
            {english ? 'KA' : 'EN'}
          </Link>
          <TrackedCta
            source="navigation"
            locale={locale}
            compact
            className="min-h-10 px-3 text-[10px] sm:min-h-11 sm:px-4 sm:text-xs md:px-5"
          />
        </div>
      </div>
    </header>
  )
}
