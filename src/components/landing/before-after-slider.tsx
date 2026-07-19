'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import { Maximize2, MoveHorizontal, X } from 'lucide-react'

import type { CampaignAssetSet } from '@/lib/campaign-assets'
import type { AppLocale } from '@/lib/i18n'

const INITIAL_POSITION = 54

type ComparisonAssets = Pick<CampaignAssetSet, 'heroBefore' | 'heroAfter'>
type ComparisonProps = ComparisonAssets & {
  kind?: CampaignAssetSet['kind']
  locale?: AppLocale
}

type ComparisonStageProps = ComparisonAssets & {
  eager?: boolean
  locale: AppLocale
  position: number
  onChange: (position: number) => void
  onInteract: () => void
}

function ComparisonStage({
  eager = false,
  heroBefore,
  heroAfter,
  locale,
  position,
  onChange,
  onInteract,
}: ComparisonStageProps) {
  const english = locale === 'en'

  return (
    <div
      className="ba-frame aspect-[3/2]"
      style={{ '--ba-pos': position } as React.CSSProperties}
    >
      <div className="ba-layer">
        <Image
          src={heroAfter.src}
          alt={heroAfter.alt}
          fill
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          quality={90}
          sizes={eager ? '(max-width: 1024px) 94vw, 690px' : '94vw'}
          className={`object-cover ${heroAfter.objectPosition}`}
        />
        <span className="ad-watermark" aria-hidden="true">
          AUTOPOST · PREVIEW
        </span>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pt-16 pb-3 sm:pb-4">
          <div className="flex flex-col items-end gap-1.5 px-3 sm:px-5">
            <p className="bg-amber text-graphite px-2.5 py-1 font-mono text-sm font-semibold tracking-[-0.01em] sm:px-3 sm:text-base">
              {heroAfter.price}
            </p>
            <div className="max-w-[min(100%,20rem)] text-right">
              <p className="text-ivory text-sm font-extrabold tracking-[-0.02em] drop-shadow sm:text-base">
                {heroAfter.model}
              </p>
              <p className="text-ivory/75 font-mono text-[9px] tracking-[0.035em] drop-shadow sm:text-[11px]">
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
          {english ? 'Ready image' : 'მზა კადრი'}
        </span>
      </div>

      <div className="ba-layer ba-before">
        <Image
          src={heroBefore.src}
          alt={heroBefore.alt}
          fill
          loading={eager ? 'eager' : 'lazy'}
          quality={86}
          sizes={eager ? '(max-width: 1024px) 94vw, 690px' : '94vw'}
          className={`object-cover ${heroBefore.objectPosition}`}
        />
        <span className="media-label absolute top-3 left-3 sm:top-4 sm:left-4">
          {english ? 'Original photo' : 'ჩვეულებრივი ფოტო'} ·{' '}
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
        onPointerDown={onInteract}
        onKeyDown={onInteract}
        onChange={(event) => {
          onInteract()
          onChange(Number(event.target.value))
        }}
        className="ba-range"
        aria-label={
          english
            ? 'Move the comparison line — original photo on the left, AutoPost result on the right'
            : 'შედარების ხაზის გადაადგილება — მარცხნივ ჩვეულებრივი ფოტო, მარჯვნივ AutoPost-ის მზა რეკლამა'
        }
      />
    </div>
  )
}

export function BeforeAfterSlider({
  heroBefore,
  heroAfter,
  kind = 'real',
  locale = 'ka',
}: ComparisonProps) {
  const english = locale === 'en'
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const stopAutoPlay = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setIsAutoPlaying(false)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    timersRef.current = [
      setTimeout(() => {
        setIsAutoPlaying(true)
        setPosition(78)
      }, 400),
      setTimeout(() => setPosition(22), 1450),
      setTimeout(() => setPosition(INITIAL_POSITION), 2650),
      setTimeout(() => setIsAutoPlaying(false), 3800),
    ]

    return stopAutoPlay
  }, [stopAutoPlay])

  function openDialog() {
    stopAutoPlay()
    setIsDialogOpen(true)
    if (!dialogRef.current?.open) dialogRef.current?.showModal()
  }

  return (
    <>
      <figure className={`ba-shell m-0 ${isAutoPlaying ? 'ba-auto' : ''}`}>
        <div className="ba-toolbar">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="ba-status-dot" aria-hidden="true" />
            <span className="text-ivory/70 truncate font-mono text-[9px] font-semibold tracking-[0.15em] uppercase sm:text-[10px]">
              {kind === 'showcase'
                ? english
                  ? 'Illustrative demo · same car'
                  : 'საილუსტრაციო დემო · იგივე მანქანა'
                : english
                  ? 'Real photo · real result'
                  : 'რეალური ფოტო · რეალური შედეგი'}
            </span>
          </div>

          <div
            className="ba-pipeline hidden items-center gap-2 sm:flex"
            aria-hidden="true"
          >
            <span>RAW</span>
            <i />
            <strong>AUTOPOST</strong>
            <i />
            <span>READY</span>
          </div>

          <button
            type="button"
            onClick={openDialog}
            className="ba-expand"
            aria-label={
              english
                ? 'Open larger comparison'
                : 'შედარების დიდ ფანჯარაში გახსნა'
            }
          >
            <Maximize2 aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">
              {english ? 'Enlarge' : 'გადიდება'}
            </span>
          </button>
        </div>

        <ComparisonStage
          eager
          heroBefore={heroBefore}
          heroAfter={heroAfter}
          locale={locale}
          position={position}
          onChange={setPosition}
          onInteract={stopAutoPlay}
        />

        <figcaption className="ba-caption">
          <span>← {english ? "Seller's photo" : 'გამყიდველის ფოტო'}</span>
          <span className="text-amber">
            {english ? 'Ready to list' : 'მზა განცხადება'} →
          </span>
        </figcaption>
      </figure>

      <dialog
        ref={dialogRef}
        className="ba-dialog"
        aria-labelledby="ba-dialog-title"
        onClose={() => setIsDialogOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <div className="ba-dialog-panel">
          <div className="ba-dialog-head">
            <div>
              <p className="text-amber font-mono text-[9px] font-semibold tracking-[0.2em] uppercase">
                Before / After
              </p>
              <h2
                id="ba-dialog-title"
                className="text-ivory mt-1 text-base font-bold tracking-[-0.02em] sm:text-lg"
              >
                {english
                  ? 'Slide to compare the full image'
                  : 'გაასრიალე და შეადარე სრული კადრი'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="ba-dialog-close"
              aria-label={english ? 'Close dialog' : 'ფანჯრის დახურვა'}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          {isDialogOpen ? (
            <ComparisonStage
              heroBefore={heroBefore}
              heroAfter={heroAfter}
              locale={locale}
              position={position}
              onChange={setPosition}
              onInteract={stopAutoPlay}
            />
          ) : null}

          <p className="text-ivory/45 mt-3 text-center text-xs leading-5 sm:text-sm">
            {english
              ? 'The same car, improved with cleaner framing and natural editing—ready to sell.'
              : 'იგივე მანქანა — უფრო სუფთა კომპოზიციითა და ბუნებრივი დამუშავებით, გასაყიდად მზა კადრად.'}
          </p>
        </div>
      </dialog>
    </>
  )
}
