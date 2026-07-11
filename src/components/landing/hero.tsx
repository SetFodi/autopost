import { Check, Clock3, Sparkles } from 'lucide-react'

import { BeforeAfterSlider } from '@/components/landing/before-after-slider'
import { TrackedCta } from '@/components/landing/tracked-cta'

const trustItems = [
  { icon: Check, text: 'პირველი Preview უფასოა' },
  { icon: Clock3, text: 'მიწოდება 24 საათში' },
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

export function Hero() {
  return (
    <section
      id="top"
      className="grain bg-graphite relative overflow-hidden pt-10 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20"
    >
      {/* Soft atmosphere — no competing car photo */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="bg-amber/[0.045] absolute top-[-25%] left-1/2 h-[50%] w-[70%] -translate-x-1/2 rounded-full blur-[110px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="site-container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="reveal reveal-1 text-amber mb-4 inline-flex items-center justify-center gap-3 font-mono text-[11px] font-semibold tracking-[0.26em] sm:mb-5 sm:text-xs">
            <span className="bg-amber h-px w-6" aria-hidden="true" />
            AUTOPOST FOR CARS
            <span className="bg-amber h-px w-6" aria-hidden="true" />
          </p>

          <h1 className="font-display reveal reveal-2 text-ivory text-[clamp(1.95rem,4.4vw,3.35rem)] leading-[1.08] font-extrabold tracking-[-0.04em] [overflow-wrap:anywhere]">
            ჩვეულებრივი ფოტოები{' '}
            <span className="text-amber" aria-hidden="true">
              →
            </span>{' '}
            პროფესიონალური მანქანის რეკლამა
          </h1>

          <p className="reveal reveal-3 text-ivory/58 mx-auto mt-4 max-w-xl text-[0.95rem] leading-7 sm:mt-5 sm:text-base sm:leading-8">
            ატვირთე ნებისმიერი მარკის ავტომობილის ფოტოები და მიიღე მზა Reel,
            Story, carousel და გაყიდვის ტექსტი — ქართულ, ინგლისურ და რუსულ
            ენებზე.
          </p>

          <div className="reveal reveal-4 mt-6 flex flex-col items-center gap-3.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-5">
            <TrackedCta
              source="hero"
              className="w-full max-w-xs justify-between sm:w-auto sm:max-w-none sm:min-w-[240px]"
            />
            <p className="text-ivory/48 text-xs leading-5 sm:text-left">
              ჯერ უფასო Preview.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              გადახდა — მხოლოდ თუ მოგეწონება.
            </p>
          </div>

          <ul className="reveal reveal-5 mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-7 sm:gap-x-6">
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
        </div>

        <div className="reveal reveal-4 mx-auto mt-8 max-w-5xl sm:mt-10 lg:mt-11">
          <BeforeAfterSlider />
        </div>

        <p className="reveal reveal-5 text-ivory/32 mt-5 text-center font-mono text-[10px] tracking-[0.16em] uppercase sm:mt-6 sm:text-[11px]">
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
