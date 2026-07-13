import {
  Check,
  ImagePlus,
  LockKeyhole,
  ScanSearch,
  WandSparkles,
} from 'lucide-react'

import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'როგორ მუშაობს AutoPost | მანქანის რეკლამა ფოტოებიდან'
const description =
  'ატვირთე 3–15 მანქანის ფოტო, მიუთითე ძირითადი მონაცემები და მიიღე უფასო Preview: Reel, Story, carousel, პოსტი და ტექსტი სამ ენაზე.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/how-it-works',
})

const steps = [
  {
    number: '01',
    title: 'ატვირთე 3–15 ფოტო',
    description:
      'აირჩიე ტელეფონით გადაღებული კადრები. ფოტოები შეიძლება იყოს სხვადასხვა ზომისა და პროპორციის — სრული კადრი დამუშავებისას შენარჩუნდება.',
    icon: ImagePlus,
  },
  {
    number: '02',
    title: 'დაამატე სწორი მონაცემები',
    description:
      'მოდელი, წელი, ფასი და WhatsApp ნომერი აუცილებელია. გარბენი, ძრავი, ტრანსმისია და დამატებითი ინფორმაცია შედეგს უფრო სრულს ხდის.',
    icon: ScanSearch,
  },
  {
    number: '03',
    title: 'AutoPost ქმნის პაკეტს',
    description:
      'სისტემა ამზადებს სოციალურ ფორმატებს, watermark-იან Preview-ს და სამენოვან გაყიდვის ტექსტს შენს პირად შედეგების გვერდზე.',
    icon: WandSparkles,
  },
  {
    number: '04',
    title: 'ჯერ ნახე, შემდეგ გადაწყვიტე',
    description:
      'Preview უფასოა. თუ მოგეწონა, სრული პაკეტის მიღება შეგიძლია watermark-ის გარეშე — 14.90₾-ად.',
    icon: Check,
  },
] as const

const photoChecklist = [
  'წინა სამი-მეოთხედის მკაფიო კადრი',
  'უკანა ან გვერდითი კადრი',
  'სალონი ან ცენტრალური დაფა',
  'დისკები, ფარები ან მნიშვნელოვანი დეტალი',
  'მარტივი ფონი და ბუნებრივი განათება',
] as const

export default function HowItWorksPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')

  return (
    <MarketingPageShell path="/how-it-works">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'როგორ მივიღოთ AutoPost-ის მანქანის სარეკლამო პაკეტი',
          description,
          totalTime: 'PT10M',
          supply: [{ '@type': 'HowToSupply', name: '3–15 მანქანის ფოტო' }],
          step: steps.map((step) => ({
            '@type': 'HowToStep',
            name: step.title,
            text: step.description,
            url: `${siteUrl}/how-it-works#step-${step.number}`,
          })),
        }}
      />

      <MarketingHero
        index="02"
        eyebrow="მარტივი პროცესი · პირადი შედეგი"
        title="ოთხი ნაბიჯი"
        accent="მზად კონტენტამდე."
        description="ანგარიში, რთული რედაქტორი და დიზაინის ცოდნა არ გჭირდება. აგზავნი ნამდვილ ფოტოებსა და ზუსტ მონაცემებს — AutoPost დანარჩენ პროცესს ერთ პირად შედეგების გვერდზე აწყობს."
      />

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <ol className="border-b border-white/10">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <li
                  id={`step-${step.number}`}
                  key={step.number}
                  className="grid gap-5 border-t border-white/10 py-7 sm:grid-cols-[5rem_0.7fr_1fr_auto] sm:items-start sm:py-10"
                >
                  <span className="text-amber font-mono text-sm tracking-[0.16em]">
                    {step.number}
                  </span>
                  <h2 className="font-display text-ivory text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                    {step.title}
                  </h2>
                  <p className="text-ivory/50 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8">
                    {step.description}
                  </p>
                  <span className="border-amber/25 text-amber grid size-11 place-items-center border">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="bg-ivory text-graphite py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-graphite/50 font-mono text-[10px] font-semibold tracking-[0.22em] uppercase">
              უკეთესი input → უკეთესი output
            </p>
            <h2 className="font-display mt-4 max-w-xl text-4xl leading-[1.06] font-extrabold tracking-[-0.05em] sm:text-6xl">
              რა ფოტოები მუშაობს საუკეთესოდ?
            </h2>
            <p className="text-graphite/55 mt-5 max-w-lg text-base leading-8">
              მინიმუმი 3 ფოტოა, მაგრამ რამდენიმე განსხვავებული კუთხე უფრო სრულ
              და დამაჯერებელ პაკეტს ქმნის.
            </p>
          </div>
          <ul className="border-y border-black/10">
            {photoChecklist.map((item, index) => (
              <li
                key={item}
                className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-black/10 py-5 last:border-b-0 sm:py-6"
              >
                <span className="text-amber font-mono text-xs">
                  0{index + 1}
                </span>
                <span className="font-display text-lg font-bold tracking-[-0.025em] sm:text-xl">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/[0.07] py-14 sm:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-2">
          <article className="surface-card p-6 sm:p-8">
            <LockKeyhole className="text-amber size-6" aria-hidden="true" />
            <h2 className="font-display text-ivory mt-8 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              შედეგი პირადია
            </h2>
            <p className="text-ivory/50 mt-4 text-sm leading-8">
              შედეგების გვერდი დაცულია გრძელი პირადი ბმულით და საძიებო
              სისტემებში არ ინდექსირდება. ატვირთული ფოტოები საჯაროდ თანხმობის
              გარეშე არ ქვეყნდება.
            </p>
          </article>
          <article className="border-amber/25 bg-amber/[0.055] border p-6 sm:p-8">
            <WandSparkles className="text-amber size-6" aria-hidden="true" />
            <h2 className="font-display text-ivory mt-8 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              ფოტო რეალური რჩება
            </h2>
            <p className="text-ivory/50 mt-4 text-sm leading-8">
              AutoPost არ უნდა აქცევდეს მანქანას არარეალურ artwork-ად. ჩვენი
              მიმართულებაა სწორი პროპორცია, მკაფიო ინფორმაცია და უკეთესი
              პრეზენტაცია — მანქანის რეალური დეტალების შენარჩუნებით.
            </p>
          </article>
        </div>
      </section>

      <MarketingCtaBand source="how_it_works_page" />
    </MarketingPageShell>
  )
}
