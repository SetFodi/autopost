import { BookOpen } from 'lucide-react'

import { EditorialLink } from '@/components/marketing/editorial-link'
import { marketingGuides } from '@/lib/marketing/content'

export function GuideTeasers() {
  return (
    <section className="border-t border-white/[0.07] bg-[#100e0c] py-16 sm:py-24 lg:py-28">
      <div className="site-container grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <span className="border-amber/30 text-amber grid size-11 place-items-center border">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <p className="section-kicker mt-7">გაყიდვის გზამკვლევები</p>
          <h2 className="font-display text-ivory max-w-md text-3xl leading-tight font-extrabold tracking-[-0.045em] sm:text-5xl">
            უკეთესი განცხადება იწყება სწორი მასალით.
          </h2>
          <p className="text-ivory/45 mt-5 max-w-sm text-sm leading-7">
            პრაქტიკული ქართული რჩევები ფოტოების, ტექსტისა და მანქანის უფრო
            დამაჯერებლად წარმოჩენის შესახებ.
          </p>
        </div>

        <div className="border-b border-white/10">
          {marketingGuides.map((guide, index) => (
            <EditorialLink
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              index={String(index + 1).padStart(2, '0')}
              title={guide.title}
              description={`${guide.description} · ${guide.readingMinutes} წუთი`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
