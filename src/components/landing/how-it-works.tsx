import { Clock4, ImagePlus, ListPlus } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'ატვირთე ფოტოები',
    description: 'გამოგზავნე ავტომობილის 5–15 რეალური ფოტო ტელეფონიდან.',
    icon: ImagePlus,
  },
  {
    number: '02',
    title: 'მიუთითე ინფორმაცია',
    description: 'დაგვჭირდება მხოლოდ მოდელი, წელი, ფასი და საკონტაქტო ნომერი.',
    icon: ListPlus,
  },
  {
    number: '03',
    title: 'მიიღე Preview',
    description:
      'პირად გვერდზე წყლის ნიშნით დაცული Preview ავტომატურად გამოჩნდება.',
    icon: Clock4,
  },
] as const

export function HowItWorks() {
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
              როგორ მუშაობს
            </p>
            <h2 className="font-display max-w-md text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.045em]">
              სამი ნაბიჯი უკეთეს რეკლამამდე
            </h2>
          </div>
          <p className="text-graphite/55 max-w-md text-base leading-8 lg:justify-self-end">
            ანგარიშის შექმნა და რთული ინსტრუქციები არ გჭირდება. გამოგზავნე
            მასალა — AutoPost ფორმატებს ავტომატურად მოამზადებს.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:mt-14 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <li key={step.number} className="step-card p-6 sm:p-7 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-amber font-mono text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    {step.number}
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
                  {step.title}
                </h3>
                <p className="text-graphite/55 mt-3 max-w-xs text-sm leading-7">
                  {step.description}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
