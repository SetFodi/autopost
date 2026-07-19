import { BeforeAfter } from '@/components/landing/before-after'
import { Deliverables } from '@/components/landing/deliverables'
import { GuideTeasers } from '@/components/landing/guide-teasers'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { LandingAnalytics } from '@/components/landing/landing-analytics'
import { Pricing } from '@/components/landing/pricing'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { SubmissionSection } from '@/components/landing/submission-section'
import { JsonLd } from '@/components/marketing/json-ld'
import { getLocalizedCampaignAssets } from '@/lib/campaign-assets'
import { getCampaignAssetSelection } from '@/lib/campaign-assets.server'
import type { AppLocale } from '@/lib/i18n'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl().toString()

export function LandingPage({ locale }: { locale: AppLocale }) {
  const english = locale === 'en'
  const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost'
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim()
  const campaign = getCampaignAssetSelection()
  const assets = getLocalizedCampaignAssets(campaign.assets, locale)
  const pageUrl = english ? new URL('/en', siteUrl).toString() : siteUrl

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'AutoPost',
        legalName: operator !== 'AutoPost' ? operator : undefined,
        url: siteUrl,
        logo: `${siteUrl}icon.svg`,
        areaServed: { '@type': 'Country', name: 'Georgia' },
        contactPoint: phone
          ? {
              '@type': 'ContactPoint',
              telephone: phone,
              contactType: 'customer support',
              availableLanguage: ['ka', 'en', 'ru'],
            }
          : undefined,
        sameAs: facebook ? [facebook] : undefined,
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: english
          ? 'AutoPost — Professional car ads from your photos'
          : 'AutoPost — მანქანის პროფესიონალური რეკლამა ფოტოებიდან',
        inLanguage: locale,
        isPartOf: { '@id': `${siteUrl}#website` },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'AutoPost',
        alternateName: 'AutoPost for Cars',
        inLanguage: ['ka', 'en'],
        publisher: { '@id': `${siteUrl}#organization` },
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}#service`,
        name: 'AutoPost for Cars',
        description: english
          ? 'Turn real vehicle photos into a professional Reel, Stories, carousel, marketplace card, and sales copy in three languages.'
          : 'ავტომობილის ფოტოებიდან პროფესიონალური Reel, Story, carousel, კვადრატული ბარათი და გაყიდვის ტექსტი სამ ენაზე.',
        serviceType: 'Automotive advertising content preparation',
        areaServed: { '@type': 'Country', name: 'Georgia' },
        provider: { '@id': `${siteUrl}#organization` },
        offers: [
          {
            '@type': 'Offer',
            name: english ? 'Free preview' : 'უფასო Preview',
            price: '0',
            priceCurrency: 'GEL',
          },
          {
            '@type': 'Offer',
            name: english ? 'Complete kit' : 'სრული პაკეტი',
            price: '14.90',
            priceCurrency: 'GEL',
          },
        ],
      },
    ],
  }

  return (
    <div lang={locale}>
      <LandingAnalytics path={english ? '/en' : '/'} />
      <JsonLd data={structuredData} />
      <SiteHeader locale={locale} />
      <main>
        <Hero assets={assets} locale={locale} />
        <BeforeAfter assets={assets} locale={locale} />
        <Deliverables assets={assets} locale={locale} />
        <HowItWorks locale={locale} />
        <Pricing locale={locale} />
        <GuideTeasers locale={locale} />
        <SubmissionSection locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}
