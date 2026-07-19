import { Clock4, ImagePlus, ListPlus } from 'lucide-react'

import type { AppLocale } from '@/lib/i18n'

const stepIcons = [ImagePlus, ListPlus, Clock4] as const

export function HowItWorks({ locale = 'ka' }: { locale?: AppLocale }) {
  const english = locale === 'en'
  const steps = english
    ? [
        ['Upload your photos', 'Send 3–15 real photos from your phone.'],
        [
          'Add the essentials',
          'We only need the model, year, price, and contact number.',
        ],
        [
          'Receive your preview',
          'A watermarked preview appears automatically on your private page.',
        ],
      ]
    : [
        [
          'ატვირთე ფოტოები',
          'გამოგზავნე ავტომობილის 3–15 რეალური ფოტო ტელეფონიდან.',
        ],
        [
          'მიუთითე ინფორმაცია',
          'დაგვჭირდება მხოლოდ მოდელი, წელი, ფასი და საკონტაქტო ნომერი.',
        ],
        [
          'მიიღე Preview',
          'პირად გვერდზე watermark-ით დაცული Preview ავტომატურად გამოჩნდება.',
        ],
      ]
  return (
    <section
      id="how-it-works"
      className="bg-ivory text-graphite relative overflow-hidden py-16 sm:py-24 lg:py-28"
    >
      <div
        className="via-amber/40 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="site-container">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-graphite/50 mb-3 font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
              {english ? 'HOW IT WORKS' : 'როგორ მუშაობს'}
            </p>
            <h2 className="font-display max-w-md text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.045em]">
              {english
                ? 'Three steps to a stronger listing'
                : 'სამი ნაბიჯი უკეთეს რეკლამამდე'}
            </h2>
          </div>
          <p className="text-graphite/55 max-w-md text-base leading-8 lg:justify-self-end">
            {english
              ? 'No account and no complicated instructions. Send your material and AutoPost prepares every format automatically.'
              : 'ანგარიშის შექმნა და რთული ინსტრუქციები არ გჭირდება. გამოგზავნე მასალა — AutoPost ფორმატებს ავტომატურად მოამზადებს.'}
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3">
          {steps.map(([title, description], index) => {
            const Icon = stepIcons[index]!
            const number = String(index + 1).padStart(2, '0')
            return (
              <li key={number} className="step-card p-6 sm:p-7 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-amber font-mono text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    {number}
                  </span>
                  <span className="border-graphite/12 text-graphite/70 grid size-10 place-items-center border">
                    <Icon
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={1.7}
                    />
                  </span>
                </div>
                <h3 className="font-display mt-10 text-xl font-semibold tracking-[-0.03em] sm:mt-14 sm:text-2xl">
                  {title}
                </h3>
                <p className="text-graphite/55 mt-3 max-w-xs text-sm leading-7">
                  {description}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
