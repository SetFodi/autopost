import { Check, Minus } from 'lucide-react'

import { Pricing } from '@/components/landing/pricing'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { AUTOPOST_PACKAGE_PRICE } from '@/lib/fulfillment/config'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'AutoPost-ის ფასი | უფასო Preview და სრული პაკეტი'
const description =
  'პირველი AutoPost Preview უფასოა. სრული მანქანის სარეკლამო პაკეტი watermark-ის გარეშე ღირს 14.90₾ და მოიცავს Reel-ს, Story-ებს, carousel-ს, პოსტსა და ტექსტს.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/pricing',
})

const comparison = [
  ['პირადი შედეგების გვერდი', true, true],
  ['Reel და დიზაინების ნახვა', true, true],
  ['Watermark-ით დაცული', true, false],
  ['Watermark-ის გარეშე ფაილები', false, true],
  ['ZIP პაკეტის ჩამოტვირთვა', false, true],
  ['ტექსტი KA / EN / RU', true, true],
] as const

export default function PricingPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/pricing">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'AutoPost მანქანის სარეკლამო პაკეტი',
          url: `${siteUrl}/pricing`,
          description,
          areaServed: { '@type': 'Country', name: 'Georgia' },
          offers: [
            {
              '@type': 'Offer',
              name: 'უფასო Preview',
              price: '0',
              priceCurrency: 'GEL',
            },
            {
              '@type': 'Offer',
              name: 'სრული პაკეტი',
              price: AUTOPOST_PACKAGE_PRICE.toFixed(2),
              priceCurrency: 'GEL',
            },
          ],
        }}
      />

      <MarketingHero
        index="03"
        eyebrow="გამჭვირვალე ფასი · ნულოვანი რისკი"
        title="ჯერ უფასოდ ნახე."
        accent="შემდეგ გადაწყვიტე."
        description="AutoPost-ის პირველი Preview უფასოა. სრული პაკეტის თანხას მხოლოდ მაშინ იხდი, როდესაც უკვე ნახე შენი მანქანის შედეგი და watermark-ის გარეშე ფაილების მიღება გინდა."
      />

      <Pricing />

      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <div className="max-w-3xl">
            <p className="section-kicker">ზუსტად რას ხსნის გადახდა</p>
            <h2 className="font-display section-title">
              Preview ხედვისთვისაა. სრული პაკეტი — გამოსაქვეყნებლად.
            </h2>
          </div>

          <div className="mt-10 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.035]">
                  <th className="text-ivory/40 p-4 font-mono text-[10px] tracking-[0.16em] uppercase sm:p-5">
                    ფუნქცია
                  </th>
                  <th className="text-ivory/40 p-4 text-center font-mono text-[10px] tracking-[0.16em] uppercase sm:p-5">
                    უფასო Preview
                  </th>
                  <th className="text-amber p-4 text-center font-mono text-[10px] tracking-[0.16em] uppercase sm:p-5">
                    სრული · 14.90₾
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([label, preview, full]) => (
                  <tr key={label} className="border-t border-white/10">
                    <th className="text-ivory/68 p-4 text-sm font-medium sm:p-5">
                      {label}
                    </th>
                    {[preview, full].map((included, index) => (
                      <td key={`${label}-${index}`} className="p-4 sm:p-5">
                        <span
                          className={`mx-auto grid size-8 place-items-center border ${
                            included
                              ? 'border-amber/35 text-amber bg-amber/[0.06]'
                              : 'text-ivory/22 border-white/10'
                          }`}
                          aria-label={included ? 'შედის' : 'არ შედის'}
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

      <MarketingCtaBand source="dedicated_pricing_page" />
    </MarketingPageShell>
  )
}
