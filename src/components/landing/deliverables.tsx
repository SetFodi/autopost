import Image from 'next/image'
import {
  GalleryHorizontal,
  Languages,
  LayoutPanelTop,
  PanelsTopLeft,
  Video,
} from 'lucide-react'

import type { CampaignAssetSet } from '@/lib/campaign-assets'
import type { AppLocale } from '@/lib/i18n'

export function Deliverables({
  assets,
  locale = 'ka',
}: {
  assets: CampaignAssetSet
  locale?: AppLocale
}) {
  const english = locale === 'en'
  const deliverables = english
    ? [
        {
          format: '9:16 · 15–20 sec',
          title: 'Professional Reel',
          description:
            'A short vertical video built from your photos, price, key details, and contact information.',
          icon: Video,
          asset: assets.reel,
          colClass: '',
        },
        {
          format: '3 × 9:16',
          title: 'Story designs',
          description: 'Three vertical Stories, ready to publish.',
          icon: PanelsTopLeft,
          asset: assets.story,
          colClass: '',
        },
        {
          format: '6 slides',
          title: 'Carousel',
          description:
            'A swipeable set with the main photo, price, technical details, and contact information.',
          icon: GalleryHorizontal,
          asset: assets.carousel,
          colClass: '',
        },
        {
          format: '1:1',
          title: 'Square listing card',
          description:
            'A strong cover image for Marketplace, MyAuto, and social media.',
          icon: LayoutPanelTop,
          asset: assets.card,
          colClass: '',
        },
        {
          format: 'KA · EN · RU',
          title: 'Copy in three languages',
          description:
            'Sales-ready listing copy in Georgian, English, and Russian.',
          icon: Languages,
          asset: null,
          colClass: 'sm:col-span-2 lg:col-span-1',
        },
      ]
    : [
        {
          format: '9:16 · 15–20 წმ',
          title: 'პროფესიონალური Reel',
          description:
            '15–20 წამიანი ვერტიკალური ვიდეო მანქანის ფოტოებით, ფასით, ძირითადი მონაცემებითა და საკონტაქტო ინფორმაციით.',
          icon: Video,
          asset: assets.reel,
          /** Card spans natural portrait column */
          colClass: '',
        },
        {
          format: '3 × 9:16',
          title: 'Story დიზაინები',
          description: 'სამი 9:16 ფორმატის Story, პირდაპირ გამოსაქვეყნებლად.',
          icon: PanelsTopLeft,
          asset: assets.story,
          colClass: '',
        },
        {
          format: '6 სლაიდი',
          title: 'Carousel',
          description:
            'გადასაფურცლი დიზაინები მთავარი ფოტოთი, ფასით, ტექნიკური მონაცემებითა და კონტაქტით.',
          icon: GalleryHorizontal,
          asset: assets.carousel,
          colClass: '',
        },
        {
          format: '1:1',
          title: 'კვადრატული ბარათი',
          description:
            '1:1 დიზაინი Marketplace-ის, MyAuto-სა და სოციალური ქსელების მთავარი ფოტოსთვის.',
          icon: LayoutPanelTop,
          asset: assets.card,
          colClass: '',
        },
        {
          format: 'KA · EN · RU',
          title: 'ტექსტი სამ ენაზე',
          description:
            'გაყიდვისთვის მომზადებული აღწერა ქართულ, ინგლისურ და რუსულ ენებზე.',
          icon: Languages,
          asset: null,
          colClass: 'sm:col-span-2 lg:col-span-1',
        },
      ]

  return (
    <section id="deliverables" className="py-16 sm:py-24 lg:py-28">
      <div className="site-container">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <p className="section-kicker">
              {english ? 'WHAT YOU GET' : 'რას მიიღებ'}
            </p>
            <h2 className="font-display section-title max-w-2xl">
              {english
                ? 'One upload. Five ready-to-post formats.'
                : 'ერთი ატვირთვა. ხუთი მზა ფორმატი.'}
            </h2>
          </div>
          <p className="text-ivory/52 max-w-md text-base leading-8 lg:justify-self-end">
            {english
              ? 'Every file is built around your actual vehicle photos and information, in the right dimensions for each channel.'
              : 'ყველა ფაილი მზადდება შენი მანქანის რეალური ფოტოებისა და მონაცემების მიხედვით — გამოსაქვეყნებლად გამზადებული ზომებით.'}
          </p>
        </div>

        <ul className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((item) => {
            const Icon = item.icon
            const asset = item.asset

            return (
              <li
                key={item.title}
                className={`deliverable-card group flex flex-col ${item.colClass}`}
              >
                {asset ? (
                  <div className="flex min-h-[14rem] shrink-0 items-center justify-center border-b border-white/10 bg-[#0a0908] px-4 py-5 sm:min-h-[16rem] sm:px-5 sm:py-6">
                    {/* Native format frame — photo fills this box, never a forced wide strip */}
                    <div
                      className={`relative overflow-hidden border border-white/10 shadow-[0_20px_50px_rgb(0_0_0/0.45)] ${asset.frameClass}`}
                    >
                      <Image
                        src={asset.src}
                        alt={asset.alt}
                        fill
                        quality={92}
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
                        className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${asset.objectPosition}`}
                      />
                      <span className="plate-chip border-amber/30 text-amber bg-graphite/80 absolute top-2.5 left-2.5 backdrop-blur-sm">
                        {item.format}
                      </span>
                      <span className="media-label absolute right-2.5 bottom-2.5">
                        {asset.model}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="from-metal to-graphite-elevated relative flex min-h-[14rem] shrink-0 items-end overflow-hidden border-b border-white/10 bg-gradient-to-br p-5 sm:min-h-[16rem]">
                    <div
                      className="bg-amber/10 pointer-events-none absolute -top-8 -right-8 size-40 rounded-full blur-2xl"
                      aria-hidden="true"
                    />
                    <div className="relative flex w-full items-end justify-between gap-4">
                      <span className="plate-chip border-amber/30 text-amber">
                        {item.format}
                      </span>
                      <div className="flex gap-1.5">
                        {(['KA', 'EN', 'RU'] as const).map((lang) => (
                          <span
                            key={lang}
                            className="text-ivory/60 grid size-9 place-items-center border border-white/12 font-mono text-[10px] font-semibold"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-display text-ivory flex items-center gap-2.5 text-lg font-bold sm:text-xl">
                    <Icon
                      aria-hidden="true"
                      className="text-amber/80 size-5 shrink-0"
                      strokeWidth={1.8}
                    />
                    {item.title}
                  </h3>
                  <p className="text-ivory/50 mt-2.5 text-sm leading-7">
                    {item.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-amber/40 bg-amber/[0.05] text-ivory/65 mt-6 border-l-2 px-5 py-4 text-sm leading-7 sm:px-6">
          <strong className="text-ivory font-semibold">
            {english ? 'Important:' : 'მნიშვნელოვანია:'}
          </strong>{' '}
          {english
            ? 'AutoPost prepares the files but does not publish on your behalf. You decide where and when to post them.'
            : 'AutoPost ამ ეტაპზე მომხმარებლის ნაცვლად არაფერს აქვეყნებს. იღებ მზა ფაილებს და თვითონ განათავსებ სასურველ პლატფორმაზე.'}
        </div>
      </div>
    </section>
  )
}
