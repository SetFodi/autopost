import type { Metadata } from 'next'
import { LockKeyhole, WandSparkles } from 'lucide-react'

import { HowItWorks } from '@/components/landing/how-it-works'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'How AutoPost Works: Car Photos to Ready Ads'
const description =
  'Upload 3–15 vehicle photos, add the year and price, and receive an automatic private preview with a Reel, Stories, carousel, listing post, and sales copy.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/how-it-works',
  locale: 'en',
})

const steps = [
  [
    'Upload 3–15 real vehicle photos',
    'Use clear phone photos from different exterior and interior angles.',
  ],
  [
    'Add accurate listing details',
    'Enter the model, year, price, and a Georgian phone or WhatsApp number.',
  ],
  [
    'Receive a private preview',
    'AutoPost generates watermarked designs, a Reel, and three-language sales copy automatically.',
  ],
  [
    'Approve and unlock the complete kit',
    'If you like the preview, pay once to receive every clean, publish-ready file.',
  ],
] as const

export default function EnglishHowItWorksPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/en/how-it-works" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to create a complete car-listing content kit with AutoPost',
          description,
          inLanguage: 'en',
          totalTime: 'PT10M',
          supply: [{ '@type': 'HowToSupply', name: '3–15 vehicle photos' }],
          step: steps.map(([name, text], index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name,
            text,
            url: `${siteUrl}/en/how-it-works#step-${index + 1}`,
          })),
        }}
      />
      <MarketingHero
        locale="en"
        index="02"
        eyebrow="SIMPLE PROCESS · PRIVATE RESULTS"
        title="Real photos in."
        accent="Sales-ready content out."
        description="No account, complicated editor, or design knowledge required. Send accurate details and real photos; AutoPost organizes the complete workflow on one private results page."
      />
      <HowItWorks locale="en" />
      <section className="border-b border-white/[0.07] py-14 sm:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-2">
          <article className="surface-card p-6 sm:p-8">
            <LockKeyhole className="text-amber size-6" aria-hidden="true" />
            <h2 className="font-display text-ivory mt-8 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              Your results remain private
            </h2>
            <p className="text-ivory/50 mt-4 text-sm leading-8">
              Your results page uses a long private link and is blocked from
              search indexing. Uploaded photos are never published without
              separate permission.
            </p>
          </article>
          <article className="border-amber/25 bg-amber/[0.055] border p-6 sm:p-8">
            <WandSparkles className="text-amber size-6" aria-hidden="true" />
            <h2 className="font-display text-ivory mt-8 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              The vehicle still looks real
            </h2>
            <p className="text-ivory/50 mt-4 text-sm leading-8">
              AutoPost improves presentation without turning the car into
              artificial artwork. Correct proportions and important vehicle
              details remain visible.
            </p>
          </article>
        </div>
      </section>
      <MarketingCtaBand source="how_it_works_page_en" locale="en" />
    </MarketingPageShell>
  )
}
