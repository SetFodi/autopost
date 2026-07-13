import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { MarketingPageAnalytics } from '@/components/marketing/marketing-page-analytics'

export function MarketingPageShell({
  path,
  children,
}: {
  path: string
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingPageAnalytics path={path} />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}
