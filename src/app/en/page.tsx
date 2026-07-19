import type { Metadata } from 'next'

import { LandingPage } from '@/components/landing/landing-page'

const title = 'AutoPost — Professional car ads from your photos'
const description =
  'Upload 3–15 real vehicle photos and get a professional Reel, Stories, carousel, marketplace post, and sales copy in three languages. Your first preview is free.'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'sell a car in Georgia',
    'car listing photos',
    'vehicle advertising',
    'car sales content',
    'AutoPost Georgia',
  ],
  alternates: {
    canonical: '/en',
    languages: { 'ka-GE': '/', en: '/en', 'x-default': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ka_GE'],
    url: '/en',
    siteName: 'AutoPost',
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function EnglishHome() {
  return <LandingPage locale="en" />
}
