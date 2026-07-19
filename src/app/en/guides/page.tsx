import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'

import { EditorialLink } from '@/components/marketing/editorial-link'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { marketingGuidesEn } from '@/lib/marketing/content-en'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Car Selling Guides: Photos, Listings, and Faster Sales'
const description =
  'Original AutoPost guides on taking better car photos, writing a trustworthy vehicle listing, choosing a realistic price, and selling a car faster in Georgia.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/guides',
  locale: 'en',
})

export default function EnglishGuidesPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/en/guides" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${siteUrl}/en/guides`,
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: marketingGuidesEn.map((guide, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${siteUrl}/en/guides/${guide.slug}`,
              name: guide.title,
            })),
          },
        }}
      />
      <MarketingHero
        locale="en"
        index="06"
        eyebrow="PRACTICAL KNOWLEDGE FOR CAR SELLERS"
        title="Better photos. Better copy."
        accent="A stronger car listing."
        description="Clear, original guides for sellers who want more than a good-looking post: build a complete, trustworthy listing that gives buyers the information they need."
      >
        <span className="text-ivory/50 inline-flex items-center gap-2 text-xs font-bold">
          <BookOpen aria-hidden="true" className="text-amber size-4" />{' '}
          {marketingGuidesEn.length} original guides
        </span>
      </MarketingHero>
      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="section-kicker">READING LIBRARY</p>
            <h2 className="font-display text-ivory text-3xl font-extrabold tracking-[-0.045em]">
              Start with the problem closest to your sale.
            </h2>
          </div>
          <div className="border-b border-white/10">
            {marketingGuidesEn.map((guide, index) => (
              <EditorialLink
                key={guide.slug}
                href={`/en/guides/${guide.slug}`}
                index={String(index + 1).padStart(2, '0')}
                title={guide.title}
                description={`${guide.description} · ${guide.readingMinutes} min read`}
              />
            ))}
          </div>
        </div>
      </section>
      <MarketingCtaBand
        source="guides_index_en"
        locale="en"
        eyebrow="FROM ADVICE TO YOUR OWN VEHICLE"
        title="Upload your photos and see a finished preview."
      />
    </MarketingPageShell>
  )
}
