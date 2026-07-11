import { BeforeAfter } from '@/components/landing/before-after'
import { Deliverables } from '@/components/landing/deliverables'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { LandingAnalytics } from '@/components/landing/landing-analytics'
import { Pricing } from '@/components/landing/pricing'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { SubmissionSection } from '@/components/landing/submission-section'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl().toString()

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AutoPost for Cars',
  description:
    'ავტომობილის ფოტოებიდან პროფესიონალური Reel, Story, carousel, კვადრატული ბარათი და გაყიდვის ტექსტი სამ ენაზე.',
  serviceType: 'Automotive advertising content preparation',
  areaServed: {
    '@type': 'Country',
    name: 'Georgia',
  },
  provider: {
    '@type': 'Organization',
    name: process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'AutoPost',
    url: siteUrl,
  },
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
}

export default function Home() {
  return (
    <>
      <LandingAnalytics />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <BeforeAfter />
        <Deliverables />
        <HowItWorks />
        <Pricing />
        <SubmissionSection />
      </main>
      <SiteFooter />
    </>
  )
}
