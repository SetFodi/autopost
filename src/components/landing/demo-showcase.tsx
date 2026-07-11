import { existsSync } from 'node:fs'
import { join } from 'node:path'

import Image from 'next/image'
import { Play } from 'lucide-react'

import { demoAssets } from '@/lib/demo-assets'

/**
 * Overlapping photo collage used as an alternate hero visual.
 */
export function DemoShowcase() {
  const hasReelDemo = existsSync(
    join(process.cwd(), 'public', 'demo', 'after-reel.mp4'),
  )
  const { sourceToyota, cardMercedes, reelAudi } = demoAssets

  return (
    <div
      className="relative isolate mx-auto w-full max-w-[720px] lg:max-w-none"
      aria-label="AutoPost-ის დამუშავებამდე და დამუშავების შემდეგ მაგალითი"
    >
      <div className="bg-metal relative mr-[18%] overflow-hidden border border-white/12 shadow-2xl shadow-black/40">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 sm:p-4">
          <span className="media-label">ჩვეულებრივი ფოტო</span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/50">
            {sourceToyota.model}
          </span>
        </div>
        <Image
          src={sourceToyota.src}
          alt={sourceToyota.alt}
          width={1200}
          height={800}
          loading="eager"
          fetchPriority="high"
          quality={88}
          sizes="(max-width: 1024px) 82vw, 44vw"
          className={`aspect-[3/2] w-full object-cover ${sourceToyota.objectPosition}`}
        />
      </div>

      <div className="border-amber/35 bg-graphite relative z-20 -mt-[8%] ml-[39%] overflow-hidden border p-1.5 shadow-2xl shadow-black/55 sm:p-2">
        <div className="bg-graphite relative aspect-square overflow-hidden">
          <Image
            src={cardMercedes.src}
            alt={cardMercedes.alt}
            fill
            quality={90}
            sizes="(max-width: 1024px) 58vw, 32vw"
            className={`object-cover ${cardMercedes.objectPosition}`}
          />
        </div>
      </div>

      <div className="absolute top-[10%] -right-1 z-30 w-[30%] max-w-[172px] min-w-[104px] rotate-[2.5deg] border border-white/15 bg-[#0c0b0a] p-1.5 shadow-2xl shadow-black/65 sm:p-2">
        <div className="bg-metal relative aspect-[9/16] overflow-hidden">
          {hasReelDemo ? (
            <video
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="none"
              poster={reelAudi.src}
              aria-label={`${reelAudi.model} — Reel Preview`}
            >
              <source src="/demo/after-reel.mp4" type="video/mp4" />
              თქვენი ბრაუზერი ვიდეოს ვერ აჩვენებს.
            </video>
          ) : (
            <Image
              src={reelAudi.src}
              alt={reelAudi.alt}
              fill
              quality={90}
              sizes="172px"
              className={`object-cover ${reelAudi.objectPosition}`}
            />
          )}
          <span className="bg-amber text-graphite pointer-events-none absolute top-2 left-2 grid size-8 place-items-center rounded-full shadow-lg sm:size-9">
            <Play aria-hidden="true" className="ml-0.5 size-3.5 fill-current" />
          </span>
        </div>
      </div>

      <div className="absolute -bottom-3 left-3 z-30 flex items-center gap-2 border border-white/10 bg-[#12100e]/95 px-3 py-2 shadow-xl sm:left-5 sm:px-4 sm:py-2.5">
        <span
          className="bg-amber live-dot size-2 rounded-full"
          aria-hidden="true"
        />
        <span className="text-ivory/80 text-[10px] font-bold tracking-[0.15em] uppercase sm:text-xs">
          Before → AutoPost
        </span>
      </div>
    </div>
  )
}
