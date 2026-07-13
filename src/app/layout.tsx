import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Noto_Sans_Georgian } from 'next/font/google'

import './globals.css'
import { getSiteUrl } from '@/lib/site-url'

const sans = Noto_Sans_Georgian({
  variable: '--font-autopost-sans',
  subsets: ['georgian', 'latin', 'cyrillic-ext'],
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  variable: '--font-autopost-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

const title = 'AutoPost — მანქანის პროფესიონალური რეკლამა ფოტოებიდან'
const description =
  'ატვირთე 3–15 მანქანის ფოტო და მიიღე პროფესიონალური Reel, Story, carousel, პოსტი და გაყიდვის ტექსტი სამ ენაზე. პირველი Preview უფასოა.'

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title,
  description,
  applicationName: 'AutoPost',
  creator: 'AutoPost',
  publisher: 'AutoPost',
  category: 'automotive',
  keywords: [
    'მანქანის გაყიდვა',
    'მანქანის რეკლამა',
    'მანქანის განცხადება',
    'ავტომობილის ფოტოები',
    'AutoPost',
  ],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  openGraph: {
    type: 'website',
    locale: 'ka_GE',
    url: '/',
    siteName: 'AutoPost',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0b0a',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
