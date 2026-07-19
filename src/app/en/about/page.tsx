import type { Metadata } from 'next'
import { Eye, LockKeyhole, MapPin, MessageCircle, ScanLine } from 'lucide-react'

import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'About AutoPost: Built in Georgia for Car Sellers'
const description =
  'AutoPost turns ordinary vehicle photos into a realistic, publish-ready car advertising kit with transparent pricing, private results, and local support in Georgia.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/about',
  locale: 'en',
})

const principles = [
  [
    Eye,
    'See the result before paying',
    'The free preview lets sellers evaluate their own vehicle content before deciding whether to buy the complete package.',
  ],
  [
    ScanLine,
    'Keep the real vehicle real',
    'Visual improvement should never hide important details, change proportions, or create unrealistic buyer expectations.',
  ],
  [
    LockKeyhole,
    'Protect private customer material',
    'Uploaded photos and private result pages are not indexed or used publicly without separate permission.',
  ],
  [
    MessageCircle,
    'Offer straightforward local support',
    'Questions and corrections go to AutoPost’s official WhatsApp channel instead of disappearing into a complicated ticket system.',
  ],
] as const

export default function EnglishAboutPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost'
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim()

  return (
    <MarketingPageShell path="/en/about" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'AutoPost',
          legalName: operator !== 'AutoPost' ? operator : undefined,
          url: siteUrl,
          logo: `${siteUrl}/icon.svg`,
          description,
          areaServed: { '@type': 'Country', name: 'Georgia' },
          contactPoint: phone
            ? {
                '@type': 'ContactPoint',
                telephone: phone,
                contactType: 'customer support',
                availableLanguage: ['ka', 'en', 'ru'],
              }
            : undefined,
          sameAs: facebook ? [facebook] : undefined,
        }}
      />
      <MarketingHero
        locale="en"
        index="05"
        eyebrow="BUILT IN GEORGIA · FOR CAR SELLERS"
        title="A stronger first impression"
        accent="without a complicated process."
        description="AutoPost was built around one simple problem: a good vehicle is often let down by weak photos and an unfinished listing. We turn ordinary material into a clear, trustworthy, publish-ready package."
      >
        <span className="text-ivory/50 inline-flex items-center gap-2 text-xs font-bold">
          <MapPin aria-hidden="true" className="text-amber size-4" /> Georgia
        </span>
      </MarketingHero>
      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
          <div>
            <p className="section-kicker">WHY AUTOPOST EXISTS</p>
            <h2 className="font-display text-ivory text-4xl leading-[1.05] font-extrabold tracking-[-0.05em] sm:text-6xl">
              A sale starts with what the buyer sees first.
            </h2>
          </div>
          <div className="text-ivory/55 space-y-6 text-base leading-9">
            <p>
              Most sellers do not have the time, software, or design experience
              to create a Reel, Stories, carousel, and multilingual description
              for one vehicle listing.
            </p>
            <p>
              AutoPost reduces that work to a short form. The seller sends
              accurate details and real photos; the system creates a consistent
              package and private results page.
            </p>
            <p>
              The goal is not to make a car look cinematic or artificial. A
              strong result is realistic, clean, and easy to understand—giving
              the buyer a reason to open the listing and inspect the details.
            </p>
          </div>
        </div>
      </section>
      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <p className="section-kicker">HOW WE MAKE PRODUCT DECISIONS</p>
          <h2 className="font-display section-title">
            Four product principles.
          </h2>
          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {principles.map(
              ([Icon, principleTitle, principleDescription], index) => (
                <article
                  key={principleTitle}
                  className="bg-graphite p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="border-amber/25 text-amber grid size-10 place-items-center border">
                      <Icon aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="text-ivory/20 font-mono text-xs">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-ivory mt-10 text-2xl font-bold tracking-[-0.04em]">
                    {principleTitle}
                  </h3>
                  <p className="text-ivory/48 mt-3 text-sm leading-8">
                    {principleDescription}
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
      <MarketingCtaBand source="about_page_en" locale="en" />
    </MarketingPageShell>
  )
}
