import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react'

import { JsonLd } from '@/components/marketing/json-ld'
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import {
  MARKETING_CONTENT_UPDATED_AT,
  marketingGuides,
} from '@/lib/marketing/content'
import {
  getMarketingGuideEn,
  marketingGuidesEn,
} from '@/lib/marketing/content-en'
import { createMarketingMetadata } from '@/lib/marketing/seo'
import { getSiteUrl } from '@/lib/site-url'

const alternateSlugs: Record<string, string> = {
  'how-to-sell-a-car-faster': marketingGuides[0]!.slug,
  'how-to-take-car-photos-for-sale': marketingGuides[1]!.slug,
  'how-to-write-a-car-listing': marketingGuides[2]!.slug,
}

export function generateStaticParams() {
  return marketingGuidesEn.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/en/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const guide = getMarketingGuideEn(slug)
  if (!guide) return {}
  return createMarketingMetadata({
    title: `${guide.title} | AutoPost`,
    description: guide.description,
    path: `/en/guides/${guide.slug}`,
    locale: 'en',
    alternatePath: `/guides/${alternateSlugs[guide.slug]}`,
    type: 'article',
  })
}

export default async function EnglishGuidePage({
  params,
}: PageProps<'/en/guides/[slug]'>) {
  const { slug } = await params
  const guide = getMarketingGuideEn(slug)
  if (!guide) notFound()
  const siteUrl = getSiteUrl().toString().replace(/\/$/, '')
  const relatedGuides = marketingGuidesEn.filter(
    (item) => item.slug !== guide.slug,
  )
  const path = `/en/guides/${guide.slug}`

  return (
    <MarketingPageShell
      path={path}
      locale="en"
      languageHref={`/guides/${alternateSlugs[guide.slug]}`}
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          datePublished: MARKETING_CONTENT_UPDATED_AT,
          dateModified: MARKETING_CONTENT_UPDATED_AT,
          inLanguage: 'en',
          image: [`${siteUrl}/en/opengraph-image`],
          mainEntityOfPage: `${siteUrl}${path}`,
          author: { '@type': 'Organization', name: 'AutoPost', url: siteUrl },
          publisher: {
            '@type': 'Organization',
            name: 'AutoPost',
            logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.svg` },
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${siteUrl}/en`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Car-selling guides',
              item: `${siteUrl}/en/guides`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: guide.title,
              item: `${siteUrl}${path}`,
            },
          ],
        }}
      />
      <article>
        <header className="grain relative overflow-hidden border-b border-white/[0.07] py-14 sm:py-20 lg:py-24">
          <div className="bg-amber/[0.045] pointer-events-none absolute -top-48 left-1/2 size-[38rem] -translate-x-1/2 rounded-full blur-[130px]" />
          <div className="site-container relative max-w-5xl">
            <Link
              href="/en/guides"
              className="text-ivory/45 hover:text-amber inline-flex items-center gap-2 text-xs font-bold transition-colors"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" /> All guides
            </Link>
            <p className="section-kicker mt-10">{guide.eyebrow}</p>
            <h1 className="font-display text-ivory text-[clamp(2.5rem,7vw,5.8rem)] leading-[1.01] font-extrabold tracking-[-0.06em]">
              {guide.title}
            </h1>
            <div className="text-ivory/42 mt-7 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5 text-xs">
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="text-amber size-3.5" />{' '}
                {guide.readingMinutes} min read
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={MARKETING_CONTENT_UPDATED_AT}>
                Updated July 19, 2026
              </time>
            </div>
          </div>
        </header>
        <div className="site-container grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.25fr_0.75fr] lg:items-start lg:py-24">
          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <p className="text-amber font-mono text-[10px] tracking-[0.2em] uppercase">
              On this page
            </p>
            <ol className="text-ivory/38 mt-5 space-y-3 text-xs leading-5">
              {guide.sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#section-${index + 1}`}
                    className="hover:text-amber transition-colors"
                  >
                    {String(index + 1).padStart(2, '0')} · {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="guide-copy max-w-3xl">
            <p className="guide-lead">{guide.intro}</p>
            {guide.sections.map((section, index) => (
              <section id={`section-${index + 1}`} key={section.heading}>
                <span className="guide-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {section.note ? (
                  <p className="guide-note">{section.note}</p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </article>
      <section className="border-y border-white/[0.07] bg-[#100e0c] py-14 sm:py-20">
        <div className="site-container">
          <p className="section-kicker">READ NEXT</p>
          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
            {relatedGuides.map((item) => (
              <Link
                key={item.slug}
                href={`/en/guides/${item.slug}`}
                className="group bg-graphite p-6 transition-colors hover:bg-[#12100e] sm:p-8"
              >
                <span className="text-amber font-mono text-[10px] tracking-[0.16em]">
                  {item.readingMinutes} MIN
                </span>
                <h2 className="font-display text-ivory group-hover:text-amber mt-6 text-2xl leading-tight font-bold tracking-[-0.04em] transition-colors">
                  {item.title}
                </h2>
                <span className="text-ivory/40 mt-5 inline-flex items-center gap-2 text-xs font-bold">
                  Read guide{' '}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <MarketingCtaBand source={`guide_en_${guide.slug}`} locale="en" />
    </MarketingPageShell>
  )
}
