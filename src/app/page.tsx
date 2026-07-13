import { BeforeAfter } from '@/components/landing/before-after'
import { Deliverables } from '@/components/landing/deliverables'
import { Hero } from '@/components/landing/hero'
import { GuideTeasers } from '@/components/landing/guide-teasers'
import { HowItWorks } from '@/components/landing/how-it-works'
import { LandingAnalytics } from '@/components/landing/landing-analytics'
import { Pricing } from '@/components/landing/pricing'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { SubmissionSection } from '@/components/landing/submission-section'
import { JsonLd } from '@/components/marketing/json-ld'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl().toString()

const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost'
const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim()

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
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: 'AutoPost',
      alternateName: 'AutoPost for Cars',
      inLanguage: 'ka',
      publisher: { '@id': `${siteUrl}#organization` },
    },
    {
      '@type': 'Service',
      '@id': `${siteUrl}#service`,
      name: 'AutoPost for Cars',
      description:
        'ავტომობილის ფოტოებიდან პროფესიონალური Reel, Story, carousel, კვადრატული ბარათი და გაყიდვის ტექსტი სამ ენაზე.',
      serviceType: 'Automotive advertising content preparation',
      areaServed: { '@type': 'Country', name: 'Georgia' },
      provider: { '@id': `${siteUrl}#organization` },
      offers: [
        {
          '@type': 'Offer',
          name: 'უფასო Preview',
          price: '0',
          priceCurrency: 'GEL',
        },
        {
          '@type': 'Offer',
          name: 'სრული პაკეტი',
          price: '14.90',
          priceCurrency: 'GEL',
        },
      ],
    },
  ],
}

export default function Home() {
  return (
    <>
      <LandingAnalytics />
      <JsonLd data={structuredData} />
      <SiteHeader />
      <main>
        <Hero />
        <BeforeAfter />
        <Deliverables />
        <HowItWorks />
        <Pricing />
        <GuideTeasers />
        <SubmissionSection />
      </main>
      <SiteFooter />
    </>
  )
}
