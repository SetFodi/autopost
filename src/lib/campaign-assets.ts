import campaignManifest from '../../config/campaign-assets.json'

import { demoAssets, demoSalesCopy } from '@/lib/demo-assets'
import type { AppLocale } from '@/lib/i18n'

export type CampaignSourcePhoto = {
  src: string
  alt: string
  fileLabel: string
  model: string
  objectPosition: string
}

export type CampaignFormatAsset = {
  src: string
  alt: string
  model: string
  format: string
  objectPosition: string
  frameClass: string
  videoSrc?: string
}

export type CampaignAssetSet = {
  kind: 'real' | 'showcase'
  heroBefore: {
    src: string
    alt: string
    fileLabel: string
    objectPosition: string
  }
  heroAfter: {
    src: string
    alt: string
    model: string
    specs: string
    price: string
    objectPosition: string
  }
  sourcePhotos: readonly CampaignSourcePhoto[]
  reel: CampaignFormatAsset
  story: CampaignFormatAsset
  carousel: CampaignFormatAsset
  card: CampaignFormatAsset
  salesCopy: readonly {
    lang: string
    text: string
  }[]
}

export type CampaignAssetSelection = {
  state: 'real' | 'showcase'
  assets: CampaignAssetSet
}

const firstOriginal = campaignManifest.originals[0]!
const firstStory = campaignManifest.final.stories[0]!
const firstCarousel = campaignManifest.final.carousel[0]!

export const realCampaignManifest = campaignManifest

export const realCampaignAssets: CampaignAssetSet = {
  kind: 'real',
  heroBefore: {
    src: firstOriginal.src,
    alt: firstOriginal.alt,
    fileLabel: firstOriginal.fileLabel,
    objectPosition: firstOriginal.objectPosition,
  },
  heroAfter: {
    src: campaignManifest.final.heroAfter.src,
    alt: campaignManifest.final.heroAfter.alt,
    model: campaignManifest.vehicle.model,
    specs: campaignManifest.vehicle.specs,
    price: campaignManifest.vehicle.price,
    objectPosition: campaignManifest.final.heroAfter.objectPosition,
  },
  sourcePhotos: campaignManifest.originals.map((photo) => ({
    ...photo,
    model: campaignManifest.vehicle.model,
  })),
  reel: {
    src: campaignManifest.final.reel.poster,
    videoSrc: campaignManifest.final.reel.src,
    alt: campaignManifest.final.reel.alt,
    model: campaignManifest.vehicle.model,
    format: 'REEL · 9:16',
    objectPosition: campaignManifest.final.reel.objectPosition,
    frameClass: 'aspect-[9/14] h-[19rem] sm:h-[22rem] mx-auto',
  },
  story: {
    src: firstStory.src,
    alt: firstStory.alt,
    model: campaignManifest.vehicle.model,
    format: 'STORY · 9:16',
    objectPosition: firstStory.objectPosition,
    frameClass: 'aspect-[4/5] h-[16rem] sm:h-[19rem] mx-auto',
  },
  carousel: {
    src: firstCarousel.src,
    alt: firstCarousel.alt,
    model: campaignManifest.vehicle.model,
    format: 'CAROUSEL · 6 სლაიდი',
    objectPosition: firstCarousel.objectPosition,
    frameClass: 'aspect-[16/10] w-full',
  },
  card: {
    src: campaignManifest.final.marketplaceCard.src,
    alt: campaignManifest.final.marketplaceCard.alt,
    model: campaignManifest.vehicle.model,
    format: '1:1',
    objectPosition: campaignManifest.final.marketplaceCard.objectPosition,
    frameClass: 'aspect-square max-h-[18rem] w-full max-w-[18rem] mx-auto',
  },
  salesCopy: campaignManifest.salesCopy,
}

export const showcaseCampaignAssets: CampaignAssetSet = {
  kind: 'showcase',
  heroBefore: demoAssets.heroBefore,
  heroAfter: demoAssets.heroAfter,
  sourcePhotos: [demoAssets.sourceSonata, demoAssets.sourceToyota],
  reel: demoAssets.reelAudi,
  story: demoAssets.storyTesla,
  carousel: demoAssets.carouselPorsche,
  card: demoAssets.cardMercedes,
  salesCopy: demoSalesCopy,
}

export function selectCampaignAssets({
  assetSet,
}: {
  assetSet: string | undefined
}): CampaignAssetSelection {
  if (assetSet?.trim().toLowerCase() === 'real') {
    return { state: 'real', assets: realCampaignAssets }
  }

  return {
    state: 'showcase',
    assets: showcaseCampaignAssets,
  }
}

export function getLocalizedCampaignAssets(
  assets: CampaignAssetSet,
  locale: AppLocale,
): CampaignAssetSet {
  if (locale === 'ka') return assets

  return {
    ...assets,
    heroBefore: {
      ...assets.heroBefore,
      alt: 'Original seller photo of a vehicle before AutoPost preparation',
    },
    heroAfter: {
      ...assets.heroAfter,
      alt: `${assets.heroAfter.model} prepared by AutoPost as a realistic sales-ready vehicle image`,
    },
    sourcePhotos: assets.sourcePhotos.map((photo, index) => ({
      ...photo,
      alt: `Original seller photo ${index + 1} of ${photo.model} before AutoPost preparation`,
    })),
    reel: {
      ...assets.reel,
      alt: `${assets.reel.model} vertical car sales Reel prepared by AutoPost`,
    },
    story: {
      ...assets.story,
      alt: `${assets.story.model} Instagram Story design prepared by AutoPost`,
    },
    carousel: {
      ...assets.carousel,
      alt: `${assets.carousel.model} car sales carousel prepared by AutoPost`,
    },
    card: {
      ...assets.card,
      alt: `${assets.card.model} square marketplace listing card prepared by AutoPost`,
    },
  }
}
