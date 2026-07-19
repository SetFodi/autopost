'use client'

import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import { ResultImagePreview } from '@/components/results/result-image-preview'
import { getResultKindLabel } from '@/lib/fulfillment/result-assets'
import type { ResultAsset } from '@/lib/fulfillment/types'
import type { AppLocale } from '@/lib/i18n'

export function ResultAssetDialog({
  activeAsset,
  assets,
  onClose,
  onSelect,
  locale = 'ka',
}: {
  activeAsset: ResultAsset | null
  assets: ResultAsset[]
  onClose: () => void
  onSelect: (asset: ResultAsset) => void
  locale?: AppLocale
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const activeIndex = activeAsset
    ? assets.findIndex((asset) => asset.kind === activeAsset.kind)
    : -1

  const selectOffset = useCallback(
    (offset: number) => {
      if (activeIndex < 0 || assets.length < 2) return
      const next = (activeIndex + offset + assets.length) % assets.length
      onSelect(assets[next]!)
    },
    [activeIndex, assets, onSelect],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (activeAsset && dialog && !dialog.open) dialog.showModal()
    if (!activeAsset && dialog?.open) dialog.close()
  }, [activeAsset])

  useEffect(() => {
    if (!activeAsset) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') selectOffset(-1)
      if (event.key === 'ArrowRight') selectOffset(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeAsset, selectOffset])

  return (
    <dialog
      ref={dialogRef}
      className="result-dialog"
      aria-labelledby="result-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      {activeAsset ? (
        <div className="result-dialog-panel">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-amber font-mono text-[9px] tracking-[0.16em] uppercase">
                Output preview
              </p>
              <h2
                id="result-dialog-title"
                className="mt-1 truncate text-sm font-bold sm:text-base"
              >
                {getResultKindLabel(activeAsset.kind, locale)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={activeAsset.url}
                target="_blank"
                rel="noreferrer"
                className="text-amber hover:bg-amber hover:text-graphite inline-flex min-h-10 items-center gap-2 border border-current px-3 text-xs font-bold transition-colors"
              >
                <Download className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {locale === 'en' ? 'Download' : 'ჩამოტვირთვა'}
                </span>
              </a>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="text-ivory/60 hover:text-ivory grid size-10 place-items-center border border-white/12 transition-colors"
                aria-label={
                  locale === 'en' ? 'Close viewer' : 'ფანჯრის დახურვა'
                }
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden bg-black/45 p-3 sm:p-5">
            {activeAsset.mimeType === 'video/mp4' ? (
              <video
                key={activeAsset.url}
                src={activeAsset.url}
                controls
                playsInline
                autoPlay
                preload="metadata"
                className="max-h-[78dvh] max-w-full object-contain"
              />
            ) : (
              <ResultImagePreview
                asset={activeAsset}
                className="max-h-[78dvh] max-w-full"
              />
            )}

            {assets.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => selectOffset(-1)}
                  className="text-ivory hover:bg-amber hover:text-graphite absolute left-3 grid size-11 place-items-center border border-white/15 bg-black/60 backdrop-blur transition-colors sm:left-5"
                  aria-label={
                    locale === 'en' ? 'Previous asset' : 'წინა მასალა'
                  }
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => selectOffset(1)}
                  className="text-ivory hover:bg-amber hover:text-graphite absolute right-3 grid size-11 place-items-center border border-white/15 bg-black/60 backdrop-blur transition-colors sm:right-5"
                  aria-label={locale === 'en' ? 'Next asset' : 'შემდეგი მასალა'}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>

          <div className="text-ivory/35 flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3 font-mono text-[9px] sm:px-5">
            <span className="truncate">{activeAsset.filename}</span>
            {assets.length > 1 ? (
              <span className="shrink-0">
                {activeIndex + 1} / {assets.length}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
