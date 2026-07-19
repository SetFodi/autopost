import { Download, Maximize2 } from 'lucide-react'

import { ResultImagePreview } from '@/components/results/result-image-preview'
import { getResultKindLabel } from '@/lib/fulfillment/result-assets'
import type { ResultAsset } from '@/lib/fulfillment/types'
import type { AppLocale } from '@/lib/i18n'

export function ResultAssetCard({
  asset,
  index,
  onOpen,
  variant,
  locale = 'ka',
}: {
  asset: ResultAsset
  index: number
  onOpen: () => void
  variant: 'story' | 'square'
  locale?: AppLocale
}) {
  const label = getResultKindLabel(asset.kind, locale)
  return (
    <article
      className={`group relative shrink-0 snap-start overflow-hidden border border-white/10 bg-[#11100e] transition duration-300 hover:-translate-y-1 hover:border-[#e8a03a]/35 hover:shadow-[0_24px_70px_rgb(0_0_0/0.42)] ${
        variant === 'story' ? 'w-[min(72vw,18rem)]' : 'w-[min(82vw,21rem)]'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`relative block w-full overflow-hidden ${variant === 'story' ? 'aspect-[9/16]' : 'aspect-square'}`}
        aria-label={`${label} ${locale === 'en' ? 'open in larger viewer' : 'დიდ ფანჯარაში გახსნა'}`}
        aria-haspopup="dialog"
      >
        <ResultImagePreview asset={asset} className="transition duration-500" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />
        <span className="absolute top-3 right-3 grid size-9 place-items-center border border-white/15 bg-black/55 text-white/70 opacity-0 backdrop-blur transition group-focus-within:opacity-100 group-hover:opacity-100">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>
        <span className="absolute bottom-3 left-3 bg-black/65 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-white/65 backdrop-blur">
          {String(index + 1).padStart(2, '0')}
        </span>
      </button>
      <div className="flex items-center justify-between gap-4 border-t border-white/10 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold">{label}</p>
          <p className="text-ivory/30 mt-1 truncate font-mono text-[9px]">
            {asset.filename}
          </p>
        </div>
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="text-amber hover:bg-amber hover:text-graphite grid size-10 shrink-0 place-items-center border border-current transition-colors"
          aria-label={`${label} ${locale === 'en' ? 'download' : 'ჩამოტვირთვა'}`}
        >
          <Download className="size-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}
