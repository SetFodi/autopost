'use client'

import { useState } from 'react'

import Image from 'next/image'
import { MoveHorizontal } from 'lucide-react'

import { demoAssets } from '@/lib/demo-assets'

const INITIAL_POSITION = 48
const { heroBefore, heroAfter } = demoAssets

/**
 * Real before/after of the same model family.
 * Labels always come from demoAssets — never invent a model name here.
 */
export function BeforeAfterSlider() {
  const [position, setPosition] = useState(INITIAL_POSITION)

  return (
    <figure className="m-0">
      <div
        className="ba-frame aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2.1/1]"
        style={{ '--ba-pos': position } as React.CSSProperties}
      >
        {/* After — polished creative */}
        <div className="ba-layer">
          <Image
            src={heroAfter.src}
            alt={heroAfter.alt}
            fill
            priority
            fetchPriority="high"
            quality={92}
            sizes="(max-width: 1024px) 94vw, 1100px"
            className={`object-cover ${heroAfter.objectPosition}`}
          />
          <span className="ad-watermark" aria-hidden="true">
            AUTOPOST · PREVIEW
          </span>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pt-16 pb-3 sm:pb-4">
            <div className="flex flex-col items-end gap-1.5 px-3 sm:px-5">
              <p className="bg-amber text-graphite px-2.5 py-1 font-mono text-sm font-semibold tracking-[-0.01em] sm:px-3 sm:text-base">
                {heroAfter.price}
              </p>
              <div className="max-w-[min(100%,18rem)] text-right">
                <p className="text-ivory text-sm font-extrabold tracking-[-0.02em] drop-shadow sm:text-base">
                  {heroAfter.model}
                </p>
                <p className="text-ivory/75 font-mono text-[10px] tracking-[0.06em] drop-shadow sm:text-[11px]">
                  {heroAfter.specs}
                </p>
              </div>
            </div>
          </div>

          <span className="media-label absolute top-3 right-3 sm:top-4 sm:right-4">
            <span
              className="bg-amber live-dot size-1.5 rounded-full"
              aria-hidden="true"
            />
            AUTOPOST
          </span>
        </div>

        {/* Before — ordinary photo of the same model family */}
        <div className="ba-layer ba-before">
          <Image
            src={heroBefore.src}
            alt=""
            aria-hidden="true"
            fill
            priority
            quality={86}
            sizes="(max-width: 1024px) 94vw, 1100px"
            className={`object-cover ${heroBefore.objectPosition}`}
          />
          <span className="media-label absolute top-3 left-3 sm:top-4 sm:left-4">
            {heroBefore.fileLabel}
          </span>
        </div>

        <div className="ba-divider">
          <span className="ba-grip ba-grip-hint">
            <MoveHorizontal aria-hidden="true" className="size-5" />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="ba-range"
          aria-label="შედარების ხაზის გადაადგილება — მარცხნივ ჩვეულებრივი ფოტო, მარჯვნივ AutoPost-ის მზა რეკლამა"
        />
      </div>

      <figcaption className="text-ivory/45 mt-3 flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.14em] uppercase sm:text-[11px]">
        <span>← ჩვეულებრივი ფოტო</span>
        <span className="text-amber">მზა რეკლამა →</span>
      </figcaption>
    </figure>
  )
}
