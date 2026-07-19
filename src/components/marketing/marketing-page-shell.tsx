import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { MarketingPageAnalytics } from '@/components/marketing/marketing-page-analytics'
import { alternateMarketingPath, type AppLocale } from '@/lib/i18n'

export function MarketingPageShell({
  path,
  locale = 'ka',
  languageHref,
  children,
}: {
  path: string
  locale?: AppLocale
  languageHref?: string
  children: React.ReactNode
}) {
  return (
    <div lang={locale}>
      <MarketingPageAnalytics path={path} />
      <SiteHeader
        locale={locale}
        languageHref={languageHref ?? alternateMarketingPath(path)}
      />
      <main>{children}</main>
      <SiteFooter locale={locale} />
    </div>
  )
}
