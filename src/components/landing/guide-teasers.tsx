import { BookOpen } from 'lucide-react'

import { EditorialLink } from '@/components/marketing/editorial-link'
import { marketingGuides } from '@/lib/marketing/content'
import { marketingGuidesEn } from '@/lib/marketing/content-en'
import type { AppLocale } from '@/lib/i18n'

export function GuideTeasers({ locale = 'ka' }: { locale?: AppLocale }) {
  const english = locale === 'en'
  const guides = english ? marketingGuidesEn : marketingGuides
  return (
    <section className="border-t border-white/[0.07] bg-[#100e0c] py-16 sm:py-24 lg:py-28">
      <div className="site-container grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <span className="border-amber/30 text-amber grid size-11 place-items-center border">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <p className="section-kicker mt-7">
            {english ? 'CAR-SELLING GUIDES' : 'გაყიდვის გზამკვლევები'}
          </p>
          <h2 className="font-display text-ivory max-w-md text-3xl leading-tight font-extrabold tracking-[-0.045em] sm:text-5xl">
            {english
              ? 'A stronger listing starts with the right material.'
              : 'უკეთესი განცხადება იწყება სწორი მასალით.'}
          </h2>
          <p className="text-ivory/45 mt-5 max-w-sm text-sm leading-7">
            {english
              ? 'Practical advice on car photos, sales copy, pricing, and presenting a vehicle more convincingly.'
              : 'პრაქტიკული ქართული რჩევები ფოტოების, ტექსტისა და მანქანის უფრო დამაჯერებლად წარმოჩენის შესახებ.'}
          </p>
        </div>

        <div className="border-b border-white/10">
          {guides.map((guide, index) => (
            <EditorialLink
              key={guide.slug}
              href={`${english ? '/en' : ''}/guides/${guide.slug}`}
              index={String(index + 1).padStart(2, '0')}
              title={guide.title}
              description={`${guide.description} · ${guide.readingMinutes} ${english ? 'min read' : 'წუთი'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
