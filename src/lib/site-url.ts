const LOCAL_SITE_URL = 'http://localhost:3000'

export function getSiteUrl(): URL {
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim()
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (vercelHost ? `https://${vercelHost}` : LOCAL_SITE_URL)

  try {
    return new URL(candidate)
  } catch {
    return new URL(LOCAL_SITE_URL)
  }
}
