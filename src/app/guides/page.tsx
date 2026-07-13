import { BookOpen } from 'lucide-react'

import { EditorialLink } from '@/components/marketing/editorial-link'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { marketingGuides } from '@/lib/marketing/content'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'მანქანის გაყიდვის გზამკვლევები | AutoPost'
const description =
  'პრაქტიკული ქართული გზამკვლევები მანქანის ფოტოების, გაყიდვის განცხადების ტექსტისა და უფრო სწრაფად გაყიდვის შესახებ.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/guides',
})

export default function GuidesPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/guides">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${siteUrl}/guides`,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: marketingGuides.map((guide, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${siteUrl}/guides/${guide.slug}`,
              name: guide.title,
            })),
          },
        }}
      />

      <MarketingHero
        index="06"
        eyebrow="პრაქტიკული ცოდნა მანქანის გამყიდველისთვის"
        title="უკეთესი ფოტო. უკეთესი ტექსტი."
        accent="უკეთესი განცხადება."
        description="მოკლე, კონკრეტული და ქართული გზამკვლევები — იმისთვის, რომ მხოლოდ ლამაზი პოსტი კი არა, უფრო სრული და სანდო განცხადებაც მიიღო."
      >
        <span className="text-ivory/50 inline-flex items-center gap-2 text-xs font-bold">
          <BookOpen aria-hidden="true" className="text-amber size-4" />{' '}
          {marketingGuides.length} ორიგინალური გზამკვლევი
        </span>
      </MarketingHero>

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="section-kicker">წასაკითხი ბიბლიოთეკა</p>
            <h2 className="font-display text-ivory text-3xl font-extrabold tracking-[-0.045em]">
              დაიწყე ყველაზე ახლო პრობლემით.
            </h2>
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

      <MarketingCtaBand
        source="guides_index"
        eyebrow="თეორიიდან შენს მანქანამდე"
        title="ატვირთე ფოტოები და ნახე მზა Preview."
      />
    </MarketingPageShell>
  )
}
