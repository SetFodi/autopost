import type { Metadata } from 'next'
import { Check, Minus } from 'lucide-react'

import { Pricing } from '@/components/landing/pricing'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { AUTOPOST_PACKAGE_PRICE } from '@/lib/fulfillment/config'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'AutoPost Pricing: Free Preview and 14.90₾ Package'
const description =
  'Start with a free watermarked car-ad preview. The complete 14.90₾ package includes clean Reel, Story, carousel, listing post, ZIP download, and sales copy files.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/pricing',
  locale: 'en',
})

const comparison = [
  ['Private results page', true, true],
  ['View the Reel and designs', true, true],
  ['Protected with a watermark', true, false],
  ['Files without a watermark', false, true],
  ['Complete ZIP download', false, true],
  ['Sales copy in KA / EN / RU', true, true],
] as const

export default function EnglishPricingPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/en/pricing" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'AutoPost car-ad content package',
          url: `${siteUrl}/en/pricing`,
          description,
          areaServed: { '@type': 'Country', name: 'Georgia' },
          provider: { '@id': `${siteUrl}/#organization` },
          offers: [
            {
              '@type': 'Offer',
              name: 'Free preview',
              price: '0',
              priceCurrency: 'GEL',
            },
            {
              '@type': 'Offer',
              name: 'Complete package',
              price: AUTOPOST_PACKAGE_PRICE.toFixed(2),
              priceCurrency: 'GEL',
            },
          ],
        }}
      />
      <MarketingHero
        locale="en"
        index="03"
        eyebrow="TRANSPARENT PRICING · ZERO UPFRONT RISK"
        title="See it free."
        accent="Then decide."
        description="Your first AutoPost preview is free. Pay only after you have seen your own vehicle content and want the clean, publish-ready files without the watermark."
      />
      <Pricing locale="en" />
      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <p className="section-kicker">WHAT PAYMENT UNLOCKS</p>
          <h2 className="font-display section-title max-w-3xl">
            The preview is for evaluation. The complete kit is for publishing.
          </h2>
          <div className="mt-10 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.035]">
                  {['Feature', 'Free preview', 'Complete · 14.90₾'].map(
                    (label) => (
                      <th
                        key={label}
                        className="text-ivory/40 p-4 font-mono text-[10px] tracking-[0.16em] uppercase sm:p-5"
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {comparison.map(([label, preview, full]) => (
                  <tr key={label} className="border-t border-white/10">
                    <th className="text-ivory/68 p-4 text-sm font-medium sm:p-5">
                      {label}
                    </th>
                    {[preview, full].map((included, index) => (
                      <td
                        key={`${label}-${index}`}
                        className="p-4 text-center sm:p-5"
                      >
                        <span
                          className={`mx-auto grid size-8 place-items-center border ${included ? 'border-amber/35 text-amber bg-amber/[0.06]' : 'text-ivory/22 border-white/10'}`}
                          aria-label={included ? 'Included' : 'Not included'}
                        >
                          {included ? (
                            <Check aria-hidden="true" className="size-4" />
                          ) : (
                            <Minus aria-hidden="true" className="size-4" />
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <MarketingCtaBand source="dedicated_pricing_page_en" locale="en" />
    </MarketingPageShell>
  )
}
