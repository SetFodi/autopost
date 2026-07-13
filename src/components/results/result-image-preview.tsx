import type { ResultAsset } from '@/lib/fulfillment/types'
import { RESULT_KIND_LABELS } from '@/lib/fulfillment/result-assets'

export function ResultImagePreview({
  asset,
  className,
}: {
  asset: ResultAsset
  className: string
}) {
  return (
    // Signed private Storage URLs are intentionally rendered directly.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.url}
      alt={RESULT_KIND_LABELS[asset.kind]}
      className={`h-full w-full bg-[#080706] object-contain ${className}`}
    />
  )
}
