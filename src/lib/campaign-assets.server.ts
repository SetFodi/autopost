import 'server-only'

import {
  selectCampaignAssets,
  type CampaignAssetSelection,
} from '@/lib/campaign-assets'

export function getCampaignAssetSelection(): CampaignAssetSelection {
  return selectCampaignAssets({
    assetSet: process.env.CAMPAIGN_ASSET_SET,
    environment: process.env.NODE_ENV,
  })
}
