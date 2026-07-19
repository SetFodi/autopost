import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'

import type { CampaignAssetSet } from '@/lib/campaign-assets'
import type { AppLocale } from '@/lib/i18n'

export function BeforeAfter({
  assets,
  locale = 'ka',
}: {
  assets: CampaignAssetSet
  locale?: AppLocale
}) {
  const english = locale === 'en'
  const sourcePhotos = assets.sourcePhotos.slice(0, 2)
  const reel = assets.reel
  const carousel = assets.carousel
  const story = assets.story

  return (
    <section
      id="transformation"
      className="border-y border-white/[0.07] bg-[#100e0c] py-16 sm:py-24 lg:py-28"
    >
      <div className="site-container">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="section-kicker">
              {english
                ? 'ANY MAKE · COMPLETE KIT'
                : 'ნებისმიერი მარკა · სრული პაკეტი'}
            </p>
            <h2 className="font-display section-title max-w-3xl">
              {english
                ? 'From phone snapshots to a complete sales-ready content kit'
                : 'ტელეფონის კადრებიდან — გასაყიდად გამზადებულ კონტენტამდე'}
            </h2>
          </div>
          <p className="text-ivory/55 max-w-md text-base leading-8 lg:justify-self-end lg:pb-1">
            {english
              ? 'From Toyota to Porsche, AutoPost turns your photos into a coordinated package for Facebook, Instagram, TikTok, Marketplace, and MyAuto.'
              : 'Toyota-დან Porsche-მე — AutoPost შენი ფოტოებიდან ამზადებს სრულ სარეკლამო პაკეტს Facebook-ის, Instagram-ის, TikTok-ისა და MyAuto-სთვის.'}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-[0.78fr_auto_1.22fr] lg:items-stretch">
          <article className="surface-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <span className="text-ivory/55 font-mono text-[10px] font-semibold tracking-[0.18em]">
                {english ? 'SOURCE MATERIAL' : 'საწყისი მასალა'}
              </span>
              <span className="plate-chip text-ivory/50">
                3–15 {english ? 'PHOTOS' : 'ფოტო'}
              </span>
            </div>
            <div className="grid flex-1 gap-2 p-2">
              {sourcePhotos.map((photo) => (
                <div
                  key={photo.src}
                  className="relative aspect-[3/2] overflow-hidden bg-black/40"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    quality={88}
                    sizes="(max-width: 1024px) 92vw, 28vw"
                    className={`object-cover ${photo.objectPosition}`}
                  />
                  <span className="media-label absolute right-2 bottom-2 left-2 justify-between">
                    <span>{photo.fileLabel}</span>
                    <span className="text-ivory/55 tracking-normal normal-case">
                      {photo.model}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-ivory/45 border-t border-white/10 px-4 py-3.5 text-xs leading-5">
              {english
                ? 'Real phone photos—exactly what you already have. Any make or body style.'
                : 'ტელეფონით გადაღებული რეალური ფოტოები — ზუსტად ის, რასაც შენ გვიგზავნი. ნებისმიერი მარკა.'}
            </p>
          </article>

          <div className="hidden place-items-center lg:grid" aria-hidden="true">
            <span className="border-amber/40 text-amber bg-amber/[0.06] grid size-12 place-items-center rounded-full border">
              <ArrowRight className="size-5" strokeWidth={1.8} />
            </span>
          </div>

          <article className="border-amber/25 relative overflow-hidden border bg-[#12100e] p-3 sm:p-4">
            <div
              className="bg-amber/[0.07] pointer-events-none absolute -top-24 -right-16 size-64 rounded-full blur-3xl"
              aria-hidden="true"
            />
            <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
              <span className="text-amber font-mono text-[10px] font-semibold tracking-[0.18em]">
                AUTOPOST OUTPUT
              </span>
              <span className="plate-chip text-ivory/55 border-amber/20">
                REEL · STORY · CAROUSEL · CARD · TEXT
              </span>
            </div>

            <div className="relative grid grid-cols-[0.7fr_1.3fr] gap-2 sm:gap-3">
              <div className="relative aspect-[9/16] overflow-hidden border border-white/10 bg-black">
                {reel.videoSrc ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    playsInline
                    preload="none"
                    poster={reel.src}
                    aria-label={`${reel.model} — Reel Preview`}
                  >
                    <source src={reel.videoSrc} type="video/mp4" />
                    {english
                      ? 'Your browser cannot play this video.'
                      : 'თქვენი ბრაუზერი ვიდეოს ვერ აჩვენებს.'}
                  </video>
                ) : (
                  <Image
                    src={reel.src}
                    alt={reel.alt}
                    fill
                    quality={90}
                    sizes="(max-width: 1024px) 34vw, 18vw"
                    className={`object-cover ${reel.objectPosition}`}
                  />
                )}
                <span className="bg-amber text-graphite pointer-events-none absolute top-2 left-2 grid size-8 place-items-center rounded-full shadow-lg">
                  <Play
                    aria-hidden="true"
                    className="ml-0.5 size-3.5 fill-current"
                  />
                </span>
                <span className="media-label absolute right-2 bottom-2 left-2 justify-between">
                  <span>{reel.format}</span>
                  <span className="text-ivory/55 tracking-normal normal-case">
                    {reel.model}
                  </span>
                </span>
              </div>

              <div className="grid min-w-0 gap-2 sm:gap-3">
                <div className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-black">
                  <Image
                    src={carousel.src}
                    alt={carousel.alt}
                    fill
                    quality={90}
                    sizes="(max-width: 1024px) 56vw, 32vw"
                    className={`object-cover ${carousel.objectPosition}`}
                  />
                  <span className="media-label absolute right-2 bottom-2 left-2 justify-between">
                    <span>{carousel.format}</span>
                    <span className="text-ivory/55 tracking-normal normal-case">
                      {carousel.model}
                    </span>
                  </span>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                  <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-black">
                    <Image
                      src={story.src}
                      alt={story.alt}
                      fill
                      quality={90}
                      sizes="(max-width: 1024px) 28vw, 15vw"
                      className={`object-cover ${story.objectPosition}`}
                    />
                    <span className="media-label absolute right-2 bottom-2 left-2 justify-between">
                      <span>{story.format}</span>
                      <span className="text-ivory/55 tracking-normal normal-case">
                        {story.model}
                      </span>
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-3 border border-white/10 bg-white/[0.025] p-3 sm:p-3.5">
                    <p className="text-ivory/50 font-mono text-[9px] font-semibold tracking-[0.16em]">
                      SALES COPY
                    </p>
                    <ul className="space-y-2.5">
                      {assets.salesCopy.map((line) => (
                        <li key={line.lang} className="flex items-start gap-2">
                          <span className="text-amber pt-px font-mono text-[9px] font-semibold">
                            {line.lang}
                          </span>
                          <span className="text-ivory/70 line-clamp-2 text-[10px] leading-4 sm:text-[11px]">
                            {line.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
