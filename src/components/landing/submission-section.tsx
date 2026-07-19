import { Check, Clock3, ShieldCheck, WalletCards } from 'lucide-react'

import { SubmissionForm } from '@/components/forms/submission-form'
import type { AppLocale } from '@/lib/i18n'

const assuranceIcons = [WalletCards, Clock3, ShieldCheck] as const

export function SubmissionSection({ locale = 'ka' }: { locale?: AppLocale }) {
  const english = locale === 'en'
  const assurances = english
    ? [
        'No card or upfront payment required',
        'Watermarked preview—generated automatically',
        'Your photos stay private without your consent',
      ]
    : [
        'ბარათი და წინასწარი გადახდა არ გჭირდება',
        'Watermark-ით დაცული Preview — ავტომატურად',
        'ფოტოები საჯაროდ არ ქვეყნდება თანხმობის გარეშე',
      ]
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()

  return (
    <section
      id="preview-form"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.07] bg-[#100e0c] py-16 sm:py-24 lg:py-28"
    >
      <div
        className="bg-amber/[0.04] pointer-events-none absolute top-0 right-0 size-[420px] rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="site-container relative grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12 xl:gap-16">
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="section-kicker">
            {english ? 'FREE PREVIEW' : 'უფასო Preview'}
          </p>
          <h2 className="font-display text-ivory max-w-xl text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.04] font-bold tracking-[-0.045em] [overflow-wrap:anywhere]">
            {english
              ? 'Your car is ready to make a stronger first impression.'
              : 'შენი მანქანა უკვე მზადაა უკეთესი პირველი შთაბეჭდილებისთვის.'}
          </h2>
          <p className="text-ivory/52 mt-5 max-w-md text-base leading-8">
            {english
              ? 'Complete the short form and upload real photos. AutoPost automatically creates your first watermarked preview and private results page.'
              : 'შეავსე მოკლე ფორმა და ატვირთე რეალური ფოტოები. AutoPost ავტომატურად მოამზადებს პირველ watermark-ით დაცულ Preview-ს და პირად შედეგის გვერდს.'}
          </p>

          <ul className="mt-8 divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {assurances.map((text, index) => {
              const Icon = assuranceIcons[index]!
              return (
                <li
                  key={text}
                  className="text-ivory/62 flex items-center gap-4 py-4 text-sm leading-6"
                >
                  <span className="border-amber/30 text-amber bg-amber/[0.06] grid size-9 shrink-0 place-items-center rounded-full border">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  {text}
                </li>
              )
            })}
          </ul>

          <div className="text-ivory/48 mt-7 flex items-start gap-3 text-xs leading-6">
            <Check
              aria-hidden="true"
              className="text-amber mt-0.5 size-4 shrink-0"
            />
            <p>
              {english
                ? 'Pay only if you like the preview. The complete kit costs 14.90₾.'
                : 'გადახდა მხოლოდ იმ შემთხვევაში, თუ მიღებული Preview მოგეწონება. სრული პაკეტის ფასი არის 14.90₾.'}
            </p>
          </div>
        </div>

        <SubmissionForm whatsappNumber={whatsappNumber} locale={locale} />
      </div>
    </section>
  )
}
