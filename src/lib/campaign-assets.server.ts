import 'server-only'

import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  realCampaignManifest,
  selectCampaignAssets,
  type CampaignAssetSelection,
} from '@/lib/campaign-assets'

function hasCompleteRealAssetSet() {
  const paths = [
    ...realCampaignManifest.originals.map((asset) => asset.src),
    realCampaignManifest.final.heroAfter.src,
    realCampaignManifest.final.reel.src,
    realCampaignManifest.final.reel.poster,
    ...realCampaignManifest.final.stories.map((asset) => asset.src),
    ...realCampaignManifest.final.carousel.map((asset) => asset.src),
    realCampaignManifest.final.marketplaceCard.src,
  ]

  const metadata = [
    realCampaignManifest.vehicle.model,
    realCampaignManifest.vehicle.specs,
    realCampaignManifest.vehicle.price,
    ...realCampaignManifest.originals.map((asset) => asset.alt),
    realCampaignManifest.final.heroAfter.alt,
    realCampaignManifest.final.reel.alt,
    ...realCampaignManifest.final.stories.map((asset) => asset.alt),
    ...realCampaignManifest.final.carousel.map((asset) => asset.alt),
    realCampaignManifest.final.marketplaceCard.alt,
    ...realCampaignManifest.salesCopy.map((item) => item.text),
  ]

  return (
    metadata.every((value) => value.trim().length > 0) &&
    paths.every((assetPath) =>
      existsSync(join(process.cwd(), 'public', assetPath.replace(/^\/+/, ''))),
    )
  )
}

export function getCampaignAssetSelection(): CampaignAssetSelection {
  const requestedAssetSet = process.env.CAMPAIGN_ASSET_SET
  const assetSet =
    requestedAssetSet?.trim().toLowerCase() === 'real' &&
    hasCompleteRealAssetSet()
      ? 'real'
      : 'showcase'

  return selectCampaignAssets({
    assetSet,
  })
}
