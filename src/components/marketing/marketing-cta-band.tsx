import { TrackedCta } from '@/components/landing/tracked-cta'

export function MarketingCtaBand({
  eyebrow = 'შენი მანქანა · შენი მასალა',
  title = 'ნახე, რას მიიღებ — გადახდამდე.',
  source,
}: {
  eyebrow?: string
  title?: string
  source: string
}) {
  return (
    <section className="border-y border-white/[0.07] bg-[#100e0c] py-12 sm:py-16">
      <div className="site-container flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-amber font-mono text-[10px] font-semibold tracking-[0.22em] uppercase">
            {eyebrow}
          </p>
          <h2 className="font-display text-ivory mt-3 max-w-2xl text-3xl leading-tight font-extrabold tracking-[-0.045em] sm:text-5xl">
            {title}
          </h2>
        </div>
        <TrackedCta
          source={source}
          className="w-full justify-between sm:w-auto sm:min-w-[250px]"
        />
      </div>
    </section>
  )
}
