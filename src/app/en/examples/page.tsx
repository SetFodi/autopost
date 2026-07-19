import type { Metadata } from 'next'

import { BeforeAfter } from '@/components/landing/before-after'
import { Deliverables } from '@/components/landing/deliverables'
import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { getCampaignAssetSelection } from '@/lib/campaign-assets.server'
import { getLocalizedCampaignAssets } from '@/lib/campaign-assets'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Car Ad Examples: Before and After | AutoPost Georgia'
const description =
  'See realistic before-and-after car photo improvements plus AutoPost Reel, Story, carousel, and square listing formats built for selling a vehicle online.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/examples',
  locale: 'en',
})

export default function EnglishExamplesPage() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const campaign = getCampaignAssetSelection()
  const assets = getLocalizedCampaignAssets(campaign.assets, 'en')

  return (
    <MarketingPageShell path="/en/examples" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${siteUrl}/en/examples`,
          inLanguage: 'en',
          isPartOf: { '@id': `${siteUrl}/#website` },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: [
              'Professional car Reel',
              'Instagram Story designs',
              'Six-slide vehicle carousel',
              'Square marketplace listing card',
              'Car sales copy in three languages',
            ].map((name, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name,
            })),
          },
        }}
      />
      <MarketingHero
        locale="en"
        index="01"
        eyebrow="REALISTIC TRANSFORMATION · CORRECT FORMATS"
        title="From ordinary phone photos"
        accent="to a complete car-listing kit."
        description="See the visual direction and real proportions of every AutoPost output. The vehicle should not look artificial—it should look clearer, more consistent, and ready to sell."
      >
        <span className="plate-chip border-amber/35 text-amber">
          BEFORE · AFTER · OUTPUTS
        </span>
      </MarketingHero>
      <BeforeAfter assets={assets} locale="en" />
      <Deliverables assets={assets} locale="en" />
      <MarketingCtaBand source="examples_page_en" locale="en" />
    </MarketingPageShell>
  )
}
