import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { createMarketingMetadata } from '@/lib/marketing/seo'

const title = 'Privacy Policy | AutoPost'
const description =
  'How AutoPost collects, protects, uses, and deletes contact information, vehicle details, uploaded photos, analytics data, and private preview files.'

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/en/privacy',
  locale: 'en',
})

export default function EnglishPrivacyPage() {
  const operator =
    process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'the AutoPost operator'
  const contact =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ||
    'the official AutoPost WhatsApp or Facebook channel'

  return (
    <div lang="en">
      <SiteHeader locale="en" languageHref="/privacy" />
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
              <ShieldCheck aria-hidden="true" className="size-6" />
            </span>
            <h1 className="font-display text-ivory mt-7 text-[clamp(2.7rem,7vw,5.8rem)] leading-[1.02] font-bold tracking-[-0.06em]">
              Privacy policy
            </h1>
            <p className="text-ivory/55 mt-5 text-sm">
              Last updated: July 19, 2026
            </p>
          </header>
          <div className="legal-copy pt-4 pb-10 sm:pb-16">
            <p>
              This policy explains what information {operator} receives to
              provide the AutoPost preview and complete package, why it is
              needed, how it is protected, and how you can request deletion.
            </p>
            <h2>Information we collect</h2>
            <ul>
              <li>Your phone or WhatsApp number.</li>
              <li>Your name, if you choose to provide it.</li>
              <li>
                Vehicle details such as model, year, price, mileage, location,
                and description.
              </li>
              <li>Vehicle photos that you upload.</li>
              <li>
                Limited technical data required for security, rate limiting,
                attribution, and abuse prevention.
              </li>
            </ul>
            <h2>Why we need a phone number</h2>
            <p>
              We use the number to connect the request with its owner, provide
              support, and include the requested contact information in the
              sales material. AutoPost does not create a public account or use
              the number for unrelated promotional messages.
            </p>
            <h2>How we use vehicle photos</h2>
            <p>
              Photos are used only to create the requested Reel, Stories,
              carousel, square listing card, and sales copy. A protected preview
              is created first so you can evaluate the result before paying.
            </p>
            <p>
              Before upload, compatible browsers recreate the image and remove
              original EXIF, GPS, camera, and text metadata while preserving
              orientation and usable quality. A HEIC or HEIF file is rejected
              when the browser cannot convert it safely.
            </p>
            <h2>Private storage and publication</h2>
            <p>
              Uploads and generated results are stored in private buckets and
              accessed through temporary signed links. Your private results page
              is blocked from search indexing. We do not publish customer photos
              or generated material publicly without separate permission.
            </p>
            <h2>Analytics and Meta Pixel</h2>
            <p>
              We may count technical events such as a page view, form start, and
              completed submission. Analytics events do not contain your phone
              number, name, photos, or public reference. When Meta Pixel is
              enabled, Meta may process browser information, IP addresses,
              cookies, or similar identifiers under its own privacy policy.
            </p>
            <h2>Retention and deletion requests</h2>
            <p>
              We retain information only as long as reasonably needed to prepare
              the preview, deliver purchased files, provide support, prevent
              abuse, and meet applicable obligations. You may request deletion
              of your submission, contact information, uploaded photos, and
              generated private material.
            </p>
            <p>
              To identify the correct request, we may ask for the public
              submission reference or confirmation of the phone number used.
              Non-personal aggregate analytics that can no longer be connected
              to a submission may remain.
            </p>
            <h2>Contact</h2>
            <p>
              For access, correction, or deletion requests, contact{' '}
              <strong className="text-ivory">{contact}</strong> and include your
              public submission reference when available.
            </p>
            <p className="border-amber bg-amber/[0.055] mt-10 border-l-2 px-5 py-4 text-xs">
              This policy describes the current AutoPost service. It will be
              updated when the product or data-processing workflow materially
              changes.
            </p>
          </div>
        </article>
      </main>
      <SiteFooter locale="en" />
    </div>
  )
}
