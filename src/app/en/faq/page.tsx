import type { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'

import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { frequentlyAskedQuestionsEn } from '@/lib/marketing/content-en'
import { createMarketingMetadata } from '@/lib/marketing/seo'

const title = 'AutoPost FAQ: Photos, Pricing, Privacy, and Delivery'
const description =
  'Answers about AutoPost photo requirements, the free preview, 14.90₾ complete package, private results, processing, formats, and vehicle support.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/faq',
  locale: 'en',
})

export default function EnglishFaqPage() {
  return (
    <MarketingPageShell path="/en/faq" locale="en">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'en',
          mainEntity: frequentlyAskedQuestionsEn.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />
      <MarketingHero
        locale="en"
        index="04"
        eyebrow="CLEAR ANSWERS BEFORE YOU UPLOAD"
        title="Everything you should know"
        accent="before sending your car."
        description="From photo requirements and privacy to pricing and final delivery, these answers describe the current AutoPost workflow. If you still need help, message us on WhatsApp."
      >
        <span className="plate-chip border-amber/35 text-amber">
          {frequentlyAskedQuestionsEn.length} ANSWERS
        </span>
      </MarketingHero>
      <section className="py-14 sm:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.32fr_0.68fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <span className="border-amber/30 text-amber grid size-12 place-items-center border">
              <HelpCircle aria-hidden="true" className="size-5" />
            </span>
            <h2 className="font-display text-ivory mt-6 text-3xl font-extrabold tracking-[-0.045em]">
              Quick, accurate answers
            </h2>
            <p className="text-ivory/45 mt-3 max-w-xs text-sm leading-7">
              Every answer reflects AutoPost’s current production workflow.
            </p>
          </div>
          <div className="border-b border-white/10">
            {frequentlyAskedQuestionsEn.map((item, index) => (
              <details
                key={item.question}
                className="faq-row group border-t border-white/10"
                open={index === 0}
              >
                <summary className="text-ivory flex min-h-20 list-none items-center gap-5 py-5 text-left font-bold sm:min-h-24 sm:text-lg">
                  <span className="text-amber shrink-0 font-mono text-[10px] tracking-[0.14em]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">{item.question}</span>
                  <span
                    className="text-ivory/35 group-open:text-amber text-xl font-light transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="text-ivory/52 max-w-3xl pr-8 pb-7 pl-11 text-sm leading-8 sm:pr-14 sm:pb-9 sm:pl-14 sm:text-base">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <MarketingCtaBand
        source="faq_page_en"
        locale="en"
        eyebrow="READY TO TRY IT?"
        title="See your own car preview next."
      />
    </MarketingPageShell>
  )
}
