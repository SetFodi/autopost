export type AppLocale = 'ka' | 'en'

export function localizedHome(locale: AppLocale) {
  return locale === 'en' ? '/en' : '/'
}

export function localizedSection(locale: AppLocale, section: string) {
  return `${localizedHome(locale)}#${section}`
}
