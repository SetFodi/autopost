import { Eye, LockKeyhole, MapPin, MessageCircle, ScanLine } from 'lucide-react'

import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title =
  'AutoPost-ის შესახებ | შექმნილია საქართველოში მანქანის გამყიდველებისთვის'
const description =
  'AutoPost ჩვეულებრივი მანქანის ფოტოებიდან ქმნის გამოსაქვეყნებლად გამზადებულ სარეკლამო პაკეტს — მარტივად, გამჭვირვალე ფასით და პირადი შედეგებით.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/about',
})

const principles = [
  {
    icon: Eye,
    title: 'ჯერ ნახე, შემდეგ გადაიხადე',
    description:
      'უფასო Preview მომხმარებელს შედეგის შეფასების საშუალებას აძლევს მანამდე, სანამ სრული პაკეტის ყიდვას გადაწყვეტს.',
  },
  {
    icon: ScanLine,
    title: 'რეალური მანქანა რჩება რეალური',
    description:
      'ვიზუალური გაუმჯობესება არ უნდა მალავდეს მანქანის პროპორციებსა და მნიშვნელოვან დეტალებს ან ქმნიდეს არარეალურ მოლოდინს.',
  },
  {
    icon: LockKeyhole,
    title: 'პირადი მასალა დაცულია',
    description:
      'ატვირთული ფოტოები და შედეგების გვერდები საჯაროდ არ ინდექსირდება და თანხმობის გარეშე მაგალითებად არ ქვეყნდება.',
  },
  {
    icon: MessageCircle,
    title: 'მარტივი ადამიანური მხარდაჭერა',
    description:
      'კითხვები და შესწორებები არ იკარგება რთულ ticket სისტემაში — მხარდაჭერა ხელმისაწვდომია AutoPost-ის ოფიციალურ WhatsApp-ზე.',
  },
] as const

export default function AboutPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost'
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim()

  return (
    <MarketingPageShell path="/about">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'AutoPost',
          legalName: operator !== 'AutoPost' ? operator : undefined,
          url: siteUrl,
          logo: `${siteUrl}/icon.svg`,
          description,
          areaServed: { '@type': 'Country', name: 'Georgia' },
          contactPoint: phone
            ? {
                '@type': 'ContactPoint',
                telephone: phone,
                contactType: 'customer support',
                availableLanguage: ['ka', 'en', 'ru'],
              }
            : undefined,
          sameAs: facebook ? [facebook] : undefined,
        }}
      />

      <MarketingHero
        index="05"
        eyebrow="BUILT IN GEORGIA · FOR CAR SELLERS"
        title="უკეთესი პირველი შთაბეჭდილება"
        accent="რთული პროცესის გარეშე."
        description="AutoPost შეიქმნა ერთი მარტივი პრობლემის გამო: კარგ მანქანას ხშირად ცუდი ფოტო და დაუმუშავებელი განცხადება ვერ წარმოაჩენს. ჩვენი საქმეა ჩვეულებრივი მასალის მკაფიო, სანდო და გამოსაქვეყნებელ პაკეტად ქცევა."
      >
        <span className="text-ivory/50 inline-flex items-center gap-2 text-xs font-bold">
          <MapPin aria-hidden="true" className="text-amber size-4" /> საქართველო
        </span>
      </MarketingHero>

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
          <div>
            <p className="section-kicker">რატომ არსებობს AutoPost</p>
            <h2 className="font-display text-ivory text-4xl leading-[1.05] font-extrabold tracking-[-0.05em] sm:text-6xl">
              გაყიდვა იწყება იმით, რასაც მყიდველი პირველად ხედავს.
            </h2>
          </div>
          <div className="text-ivory/55 space-y-6 text-base leading-9">
            <p>
              მანქანის გამყიდველს ხშირად არ აქვს დრო, დიზაინის პროგრამა ან
              გამოცდილება, რომ ერთი განცხადებისთვის Reel, Story, carousel და
              სამენოვანი ტექსტი ცალ-ცალკე მოამზადოს.
            </p>
            <p>
              AutoPost ამ პროცესს ერთ მოკლე ფორმამდე ამცირებს. მომხმარებელი
              აგზავნის ნამდვილ ფოტოებსა და ზუსტ მონაცემებს; სისტემა კი ამზადებს
              თანმიმდევრულ პაკეტს და პირად შედეგების გვერდს.
            </p>
            <p>
              მიზანი არ არის ავტომობილის “კინოდ” ქცევა. კარგი შედეგი რეალისტური,
              სუფთა და გასაგებია — ზუსტად ისეთი, რომელიც მყიდველს აძლევს მიზეზს
              განცხადება გახსნას და დეტალებს გაეცნოს.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <div className="max-w-3xl">
            <p className="section-kicker">როგორ ვიღებთ გადაწყვეტილებებს</p>
            <h2 className="font-display section-title">
              ოთხი პროდუქტის პრინციპი.
            </h2>
          </div>
          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <article
                  key={principle.title}
                  className="bg-graphite p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="border-amber/25 text-amber grid size-10 place-items-center border">
                      <Icon aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="text-ivory/20 font-mono text-xs">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-ivory mt-10 text-2xl font-bold tracking-[-0.04em]">
                    {principle.title}
                  </h3>
                  <p className="text-ivory/48 mt-3 text-sm leading-8">
                    {principle.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <MarketingCtaBand source="about_page" />
    </MarketingPageShell>
  )
}
