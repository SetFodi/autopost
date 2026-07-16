import Image from 'next/image'
import {
  GalleryHorizontal,
  LayoutPanelTop,
  PanelsTopLeft,
  Video,
} from 'lucide-react'

import { BeforeAfterSlider } from '@/components/landing/before-after-slider'
import { CampaignMediaUnavailable } from '@/components/landing/campaign-media-unavailable'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { getCampaignAssetSelection } from '@/lib/campaign-assets.server'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'მანქანის რეკლამის მაგალითები | AutoPost'
const description =
  'ნახე AutoPost-ის Before/After შედარება და Reel, Story, carousel და 1:1 მანქანის პოსტის რეალური ფორმატის მაგალითები.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/examples',
})

const formatExampleDefinitions = [
  {
    icon: Video,
    eyebrow: 'REEL · 9:16',
    title: 'მოძრავი პირველი შთაბეჭდილება',
    description:
      'ვერტიკალური ვიდეო, სადაც მანქანის სრული კადრები, ფასი და საკონტაქტო ინფორმაცია ერთ მოკლე ისტორიად იკვრება.',
    frame: 'aspect-[9/16] max-h-[38rem] w-full max-w-[21.4rem]',
  },
  {
    icon: PanelsTopLeft,
    eyebrow: 'STORY · 3 კადრი',
    title: 'ვერტიკალური სერია დეტალებისთვის',
    description:
      'სამი დამოუკიდებელი Story: მთავარი კადრი, სალონი ან მნიშვნელოვანი დეტალი და მკაფიო გაყიდვის ინფორმაცია.',
    frame: 'aspect-[4/5] w-full',
  },
  {
    icon: GalleryHorizontal,
    eyebrow: 'CAROUSEL · 6 სლაიდი',
    title: 'სრული განცხადება გადასაფურცლ ფორმატში',
    description:
      'მყიდველი თანმიმდევრულად ხედავს მანქანის მთავარ კუთხეებს, მონაცემებსა და ფასს — გრძელი ტექსტის ძებნის გარეშე.',
    frame: 'aspect-[16/10] w-full',
  },
  {
    icon: LayoutPanelTop,
    eyebrow: 'POST · 1:1',
    title: 'მთავარი პოსტი და განცხადების cover',
    description:
      'ერთი მკაფიო კვადრატული კადრი Facebook-ის, Instagram-ისა და განცხადების მთავარი ფოტოსთვის.',
    frame: 'aspect-square w-full',
  },
] as const

export default function ExamplesPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const campaign = getCampaignAssetSelection()
  const formatExamples = campaign.assets
    ? [
        { ...formatExampleDefinitions[0], asset: campaign.assets.reel },
        { ...formatExampleDefinitions[1], asset: campaign.assets.story },
        { ...formatExampleDefinitions[2], asset: campaign.assets.carousel },
        { ...formatExampleDefinitions[3], asset: campaign.assets.card },
      ]
    : null

  return (
    <MarketingPageShell path="/examples">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${siteUrl}/examples`,
          isPartOf: { '@type': 'WebSite', name: 'AutoPost', url: siteUrl },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: formatExampleDefinitions.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.title,
            })),
          },
        }}
      />

      <MarketingHero
        index="01"
        eyebrow="ფორმატის რეალური მასშტაბი"
        title="ჩვეულებრივი კადრიდან"
        accent="გამოსაქვეყნებელ პაკეტამდე."
        description="ეს გვერდი აჩვენებს AutoPost-ის ვიზუალურ მიმართულებას და თითოეული ფაილის რეალურ პროპორციას. ფოტო არ უნდა გახდეს ხელოვნური — ის უბრალოდ უფრო მკაფიო, თანმიმდევრული და გასაყიდად მზად უნდა იყოს."
      >
        <span className="plate-chip border-amber/35 text-amber">
          BEFORE · AFTER · OUTPUTS
        </span>
      </MarketingHero>

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="section-kicker">01 · შედარება</p>
              <h2 className="font-display text-ivory text-3xl leading-tight font-extrabold tracking-[-0.045em] sm:text-5xl">
                იგივე მანქანა. უკეთესი პრეზენტაცია.
              </h2>
              <p className="text-ivory/50 mt-5 text-sm leading-7">
                გაასრიალე ხაზი. მარცხნივ არის ჩვეულებრივი გამყიდველის ფოტო,
                მარჯვნივ — გაყიდვისთვის გამზადებული სარეკლამო კადრის მაგალითი.
              </p>
            </div>
            {campaign.assets ? (
              <BeforeAfterSlider
                heroBefore={campaign.assets.heroBefore}
                heroAfter={campaign.assets.heroAfter}
              />
            ) : (
              <CampaignMediaUnavailable />
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20 lg:py-24">
        <div className="site-container">
          <div className="max-w-3xl">
            <p className="section-kicker">02 · სრული პაკეტი</p>
            <h2 className="font-display section-title">
              თითოეული არხისთვის — თავისი სწორი ფორმატი.
            </h2>
            <p className="text-ivory/52 mt-5 max-w-2xl text-base leading-8">
              AutoPost ერთ ფოტოს ყველა ზომაში ძალით არ ჭრის. თითოეული output
              მზადდება თავისი პროპორციით, ხოლო მანქანის მნიშვნელოვანი დეტალები
              სრულად რჩება კადრში.
            </p>
          </div>

          {formatExamples ? (
            <div className="mt-12 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-2">
              {formatExamples.map((item, index) => {
                const Icon = item.icon
                return (
                  <article
                    key={item.title}
                    className="group bg-graphite p-4 sm:p-6 lg:p-8"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-amber font-mono text-[10px] font-semibold tracking-[0.18em]">
                        {item.eyebrow}
                      </span>
                      <span className="text-ivory/25 font-mono text-xs">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="mt-5 flex min-h-[20rem] items-center justify-center overflow-hidden border border-white/10 bg-[#090807] p-3 sm:min-h-[28rem] sm:p-5">
                      <div
                        className={`relative overflow-hidden border border-white/10 shadow-[0_28px_80px_rgb(0_0_0/0.48)] ${item.frame}`}
                      >
                        <Image
                          src={item.asset.src}
                          alt={item.asset.alt}
                          fill
                          quality={92}
                          sizes="(max-width: 1024px) 88vw, 42vw"
                          className={`object-cover transition-transform duration-700 group-hover:scale-[1.025] ${item.asset.objectPosition}`}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-4">
                      <span className="border-amber/25 text-amber grid size-10 place-items-center border">
                        <Icon aria-hidden="true" className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="font-display text-ivory text-xl font-bold tracking-[-0.035em] sm:text-2xl">
                          {item.title}
                        </h3>
                        <p className="text-ivory/48 mt-2 text-sm leading-7">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <CampaignMediaUnavailable className="mt-12" />
          )}

          {campaign.state === 'development-fallback' ? (
            <p className="text-ivory/32 mt-5 text-xs leading-6">
              Development რეჟიმში გამოყენებულია ლიცენზირებული დემო-ფოტოები.
              Production კამპანიაში ისინი არ გამოჩნდება.
            </p>
          ) : campaign.state === 'real' ? (
            <p className="text-ivory/32 mt-5 text-xs leading-6">
              გვერდზე ნაჩვენებია კამპანიისთვის დამტკიცებული რეალური
              ტრანსფორმაცია.
            </p>
          ) : null}
        </div>
      </section>

      <MarketingCtaBand source="examples_page" />
    </MarketingPageShell>
  )
}
