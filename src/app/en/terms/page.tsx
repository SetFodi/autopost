import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileCheck2 } from 'lucide-react'

import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { createMarketingMetadata } from '@/lib/marketing/seo'

const title = 'Terms and Conditions | AutoPost'
const description =
  'Terms for the free AutoPost preview, 14.90₾ complete car advertising package, TBC Checkout payment, file delivery, customer rights, and refunds.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/terms',
  locale: 'en',
})

export default function EnglishTermsPage() {
  const operator =
    process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'the AutoPost operator'
  const operatorAddress = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS?.trim()
  const contact =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ||
    'the official AutoPost support channel'

  return (
    <div lang="en">
      <SiteHeader locale="en" languageHref="/terms" />
      <main className="min-h-[70vh] py-16 sm:py-24">
        <article className="site-container max-w-4xl">
          <Link
            href="/en"
            className="text-amber inline-flex items-center gap-2 text-xs font-bold hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to the home
            page
          </Link>
          <header className="mt-10 border-b border-white/10 pb-10 sm:mt-14 sm:pb-14">
            <span className="border-amber/35 text-amber grid size-12 place-items-center border">
              <FileCheck2 aria-hidden="true" className="size-6" />
            </span>
            <h1 className="font-display text-ivory mt-7 text-[clamp(2.7rem,7vw,5.8rem)] leading-[1.02] font-bold tracking-[-0.06em]">
              Terms and conditions
            </h1>
            <p className="text-ivory/55 mt-5 text-sm">
              Last updated: July 19, 2026
            </p>
          </header>
          <div className="legal-copy pt-4 pb-10 sm:pb-16">
            <p>
              AutoPost automatically prepares car-selling content from vehicle
              photos and information supplied by the customer. By submitting the
              form, you confirm that you have read and accepted these terms.
            </p>
            <h2>Free preview</h2>
            <p>
              The first preview is free, contains a visible watermark, and
              appears automatically on a private results page. Processing time
              depends on the number and quality of photos and the availability
              of technical services. Incomplete, damaged, or incompatible
              material may not process successfully.
            </p>
            <h2>Complete package and price</h2>
            <p>
              The complete package costs{' '}
              <strong className="text-ivory">14.90₾</strong> and includes a
              Reel, 3 Stories, a 6-slide carousel, one square listing card, and
              sales copy in Georgian, English, and Russian without the preview
              watermark. Payment begins only when requested by the customer and
              is completed on the secure TBC Checkout page.
            </p>
            <h2>Delivery</h2>
            <p>
              After TBC confirms a successful payment, AutoPost automatically
              creates the clean files and ZIP package. They become available on
              the same private results page. Download links are temporary, so
              customers should save the completed package to their own device.
            </p>
            <h2>Refunds and technical failures</h2>
            <p>
              If payment is confirmed but AutoPost cannot create or deliver the
              purchased clean package because of a technical failure, contact
              support with the public submission reference. We will attempt
              delivery again or review a refund where the paid service cannot be
              fulfilled.
            </p>
            <h2>Customer rights and responsibility</h2>
            <p>
              You confirm that you have the right to use the uploaded photos and
              vehicle information. You remain responsible for the accuracy of
              the price, condition, specifications, and contact details, and for
              choosing where the prepared material is published.
            </p>
            <h2>Material quality</h2>
            <p>
              The final result depends on the quality and accuracy of the
              uploaded material. Blurry, dark, incomplete, duplicated, or
              unrelated images may reduce quality or prevent automatic
              processing.
            </p>
            <h2>Contact</h2>
            <p>
              Support channel: {contact}. Operator: {operator}.
              {operatorAddress ? ` Address: ${operatorAddress}.` : ''}
            </p>
          </div>
        </article>
      </main>
      <SiteFooter locale="en" />
    </div>
  )
}
