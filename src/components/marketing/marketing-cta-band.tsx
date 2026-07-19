import { TrackedCta } from '@/components/landing/tracked-cta'
import type { AppLocale } from '@/lib/i18n'

export function MarketingCtaBand({
  eyebrow,
  title,
  source,
  locale = 'ka',
}: {
  eyebrow?: string
  title?: string
  source: string
  locale?: AppLocale
}) {
  const english = locale === 'en'

  return (
    <section className="border-y border-white/[0.07] bg-[#100e0c] py-12 sm:py-16">
      <div className="site-container flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-amber font-mono text-[10px] font-semibold tracking-[0.22em] uppercase">
            {eyebrow ??
              (english
                ? 'YOUR CAR · YOUR MATERIAL'
                : 'შენი მანქანა · შენი მასალა')}
          </p>
          <h2 className="font-display text-ivory mt-3 max-w-2xl text-3xl leading-tight font-extrabold tracking-[-0.045em] sm:text-5xl">
            {title ??
              (english
                ? 'See what you get before you pay.'
                : 'ნახე, რას მიიღებ — გადახდამდე.')}
          </h2>
        </div>
        <TrackedCta
          source={source}
          locale={locale}
          className="w-full justify-between sm:w-auto sm:min-w-[250px]"
        />
      </div>
    </section>
  )
}
