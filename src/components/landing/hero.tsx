import { Check, Clock3, Sparkles } from 'lucide-react'

import { BeforeAfterSlider } from '@/components/landing/before-after-slider'
import { CampaignMediaUnavailable } from '@/components/landing/campaign-media-unavailable'
import { TrackedCta } from '@/components/landing/tracked-cta'
import type { CampaignAssetSet } from '@/lib/campaign-assets'

const trustItems = [
  { icon: Check, text: 'პირველი Preview უფასოა' },
  { icon: Clock3, text: 'Preview ავტომატურად მზადდება' },
  { icon: Sparkles, text: 'ბარათი არ გჭირდება' },
] as const

const brandStrip = [
  'Toyota',
  'VW',
  'Mercedes',
  'Audi',
  'Porsche',
  'Tesla',
  'და სხვა',
] as const

export function Hero({ assets }: { assets: CampaignAssetSet | null }) {
  return (
    <section
      id="top"
      className="grain bg-graphite relative overflow-hidden pt-9 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20"
    >
      {/* Soft atmosphere — no competing car photo */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="bg-amber/[0.055] absolute top-[-12%] right-[-12%] h-[72%] w-[56%] rounded-full blur-[120px]" />
        <div className="absolute top-0 bottom-0 left-[54%] hidden w-px bg-gradient-to-b from-transparent via-white/[0.055] to-transparent lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="site-container relative z-10">
        <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-xl lg:py-8">
            <p className="reveal reveal-1 text-amber mb-4 inline-flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.24em] sm:mb-5 sm:text-[11px]">
              <span className="bg-amber h-px w-7" aria-hidden="true" />
              AUTOPOST · CAR LISTING KIT
            </p>

            <h1 className="font-display reveal reveal-2 text-ivory text-[clamp(2.2rem,5.4vw,4.65rem)] leading-[1.01] font-extrabold tracking-[-0.055em] [overflow-wrap:anywhere] lg:text-[clamp(3rem,4.15vw,4.65rem)]">
              ჩვეულებრივი კადრები{' '}
              <span className="text-amber block pt-1">გასაყიდ ფოტოებად.</span>
            </h1>

            <p className="reveal reveal-3 text-ivory/58 mt-5 max-w-lg text-[0.95rem] leading-7 sm:mt-6 sm:text-base sm:leading-8">
              ატვირთე მანქანის რეალური ფოტოები. AutoPost გაასუფთავებს კადრს,
              მოაწესრიგებს ფონს და მოამზადებს Reel-ს, Story-სა და განცხადებას —
              მზა ჩამოსატვირთ ფაილებად, ბუნებრივად, ზედმეტი „სტუდიური“ ეფექტის
              გარეშე.
            </p>

            <div className="reveal reveal-4 mt-7 flex flex-col items-start gap-3.5 sm:flex-row sm:items-center sm:gap-5">
              <TrackedCta
                source="hero"
                className="w-full max-w-xs justify-between sm:w-auto sm:max-w-none sm:min-w-[240px]"
              />
              <p className="text-ivory/48 text-xs leading-5">
                ჯერ უფასო Preview.
                <br />
                გადახდა — მხოლოდ თუ მოგეწონება.
              </p>
            </div>

            <ul className="reveal reveal-5 mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {trustItems.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.text}
                    className="text-ivory/60 inline-flex items-center gap-2 text-xs font-medium sm:text-[13px]"
                  >
                    <Icon
                      aria-hidden="true"
                      className="text-amber size-3.5 shrink-0"
                      strokeWidth={2.4}
                    />
                    {item.text}
                  </li>
                )
              })}
            </ul>

            <p className="reveal reveal-5 text-ivory/48 mt-5 max-w-lg border-t border-white/[0.07] pt-4 text-xs leading-6">
              AutoPost შენ ნაცვლად არაფერს აქვეყნებს — ჩამოსატვირთ ფაილებს პირად
              Preview გვერდზე მიიღებ და თავად განათავსებ სასურველ პლატფორმაზე.
            </p>
          </div>

          <div className="reveal reveal-3 min-w-0 lg:-mr-3 xl:mr-0">
            {assets ? (
              <BeforeAfterSlider
                heroBefore={assets.heroBefore}
                heroAfter={assets.heroAfter}
              />
            ) : (
              <CampaignMediaUnavailable />
            )}
          </div>
        </div>

        <p className="reveal reveal-5 text-ivory/32 mt-8 text-center font-mono text-[10px] tracking-[0.16em] uppercase sm:mt-10 sm:text-[11px] lg:text-left">
          {brandStrip.map((brand, i) => (
            <span key={brand}>
              {i > 0 ? (
                <span
                  className="text-ivory/18 mx-1.5 sm:mx-2"
                  aria-hidden="true"
                >
                  ·
                </span>
              ) : null}
              {brand}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
