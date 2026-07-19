import { Check } from 'lucide-react'

import { TrackedCta } from '@/components/landing/tracked-cta'
import type { AppLocale } from '@/lib/i18n'

const previewItemsKa = [
  'Watermark-ით დაცული',
  'Reel-ისა და დიზაინების წინასწარი ნახვა',
  'პირადი შედეგის გვერდი',
  'ავტომატური დამუშავება',
  'ბარათი არ არის საჭირო',
] as const

const packageItemsKa = [
  'Reel watermark-ის გარეშე',
  '3 Story',
  '6-სლაიდიანი carousel',
  'მთავარი კვადრატული ბარათი',
  'გაყიდვის ტექსტი ქართულ, ინგლისურ და რუსულ ენებზე',
] as const

export function Pricing({ locale = 'ka' }: { locale?: AppLocale }) {
  const english = locale === 'en'
  const previewItems = english
    ? [
        'Protected with a watermark',
        'Preview the Reel and designs',
        'Private results page',
        'Automatic processing',
        'No card required',
      ]
    : previewItemsKa
  const packageItems = english
    ? [
        'Reel without a watermark',
        '3 Stories',
        '6-slide carousel',
        'Main square listing card',
        'Sales copy in Georgian, English, and Russian',
      ]
    : packageItemsKa

  return (
    <section id="pricing" className="py-16 sm:py-24 lg:py-28">
      <div className="site-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker justify-center">
            {english
              ? 'SEE IT FIRST. THEN DECIDE.'
              : 'ჯერ ნახე. შემდეგ გადაწყვიტე.'}
          </p>
          <h2 className="font-display section-title">
            {english ? 'Start with zero risk' : 'რისკის გარეშე იწყებ'}
          </h2>
          <p className="text-ivory/52 mx-auto mt-4 max-w-md text-base leading-8">
            {english
              ? 'You only pay if you like your preview.'
              : 'გადახდა მხოლოდ იმ შემთხვევაში, თუ Preview მოგეწონება.'}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:mt-14 md:grid-cols-2">
          <article className="pricing-featured bg-ivory text-graphite relative overflow-hidden p-6 sm:p-8 lg:p-9">
            <div
              className="bg-amber/20 pointer-events-none absolute -top-16 -right-12 size-48 rounded-full blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-graphite/50 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
                    {english ? 'START HERE' : 'დაიწყე აქ'}
                  </p>
                  <h3 className="font-display mt-2 text-2xl font-extrabold sm:text-3xl">
                    {english ? 'Free preview' : 'უფასო Preview'}
                  </h3>
                </div>
                <span className="plate-chip border-graphite/20 text-graphite/60">
                  AUTO
                </span>
              </div>

              <p className="mt-7 font-mono text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
                0₾
              </p>

              <ul className="border-graphite/12 mt-8 space-y-3 border-t pt-6">
                {previewItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <Check
                      aria-hidden="true"
                      className="text-graphite mt-0.5 size-4 shrink-0"
                      strokeWidth={2.5}
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <TrackedCta
                source="pricing_preview"
                locale={locale}
                className="mt-8 w-full justify-between"
              />
            </div>
          </article>

          <article className="surface-card relative p-6 sm:p-8 lg:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-ivory/45 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {english ? 'IF YOU LIKE IT' : 'თუ მოგეწონება'}
                </p>
                <h3 className="font-display text-ivory mt-2 text-2xl font-extrabold sm:text-3xl">
                  {english ? 'Complete kit' : 'სრული პაკეტი'}
                </h3>
              </div>
              <span className="plate-chip border-amber/35 text-amber">
                NO WATERMARK
              </span>
            </div>

            <p className="text-amber mt-7 font-mono text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              14.90₾
            </p>

            <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
              {packageItems.map((item) => (
                <li
                  key={item}
                  className="text-ivory/68 flex gap-3 text-sm leading-6"
                >
                  <Check
                    aria-hidden="true"
                    className="text-amber mt-0.5 size-4 shrink-0"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-ivory/45 mt-8 border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6">
              {english
                ? 'After approving the preview, pay securely through TBC Checkout and unlock the clean files automatically on your private page.'
                : 'Preview-ს მოწონების შემდეგ გადაიხდი უსაფრთხო TBC Checkout-ით და სუფთა ფაილები ავტომატურად გაიხსნება პირად გვერდზე.'}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
