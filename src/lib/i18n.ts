export type AppLocale = 'ka' | 'en'

export const localizedMarketingPaths = {
  about: { ka: '/about', en: '/en/about' },
  examples: { ka: '/examples', en: '/en/examples' },
  faq: { ka: '/faq', en: '/en/faq' },
  guides: { ka: '/guides', en: '/en/guides' },
  home: { ka: '/', en: '/en' },
  howItWorks: { ka: '/how-it-works', en: '/en/how-it-works' },
  pricing: { ka: '/pricing', en: '/en/pricing' },
  privacy: { ka: '/privacy', en: '/en/privacy' },
  terms: { ka: '/terms', en: '/en/terms' },
} as const

export type LocalizedMarketingPage = keyof typeof localizedMarketingPaths

export function localizedHome(locale: AppLocale) {
  return localizedMarketingPaths.home[locale]
}

export function localizedSection(locale: AppLocale, section: string) {
  return `${localizedHome(locale)}#${section}`
}

export function localizedMarketingPath(
  locale: AppLocale,
  page: LocalizedMarketingPage,
) {
  return localizedMarketingPaths[page][locale]
}

export function alternateMarketingPath(path: string) {
  if (path === '/en') return '/'
  if (path.startsWith('/en/')) return path.slice(3)
  if (path === '/') return '/en'
  return `/en${path}`
}
