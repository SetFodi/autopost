import Link from 'next/link'

import { TrackedCta } from '@/components/landing/tracked-cta'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0c0b0a]/85 backdrop-blur-xl">
      <div className="site-container flex h-[68px] items-center justify-between gap-3 md:h-[72px]">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 focus-visible:outline-none"
          aria-label="AutoPost — მთავარი გვერდი"
        >
          <span className="brand-mark">AP</span>
          <span className="brand-word text-ivory text-base font-extrabold tracking-[-0.04em] sm:text-lg">
            AutoPost
          </span>
        </Link>

        <nav
          aria-label="მთავარი ნავიგაცია"
          className="text-ivory/55 hidden items-center gap-8 text-[13px] font-medium lg:flex"
        >
          <Link className="nav-link" href="/examples">
            მაგალითები
          </Link>
          <Link className="nav-link" href="/how-it-works">
            როგორ მუშაობს
          </Link>
          <Link className="nav-link" href="/pricing">
            ფასი
          </Link>
          <Link className="nav-link" href="/guides">
            გზამკვლევები
          </Link>
        </nav>

        <TrackedCta
          source="navigation"
          className="min-h-10 px-3 text-[11px] sm:min-h-11 sm:px-4 sm:text-xs md:px-5"
        />
      </div>
    </header>
  )
}
