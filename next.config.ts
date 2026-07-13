import type { NextConfig } from 'next'
import { withWorkflow } from 'workflow/next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
]

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@remotion/lambda', 'archiver'],
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff',
      './node_modules/@fontsource/noto-sans-georgian/files/noto-sans-georgian-latin-700-normal.woff',
    ],
  },
  images: {
    // Next 16 coerces any <Image quality> to the closest allowed value
    // (default [75]) — allowlist the qualities the landing actually uses.
    qualities: [75, 86, 88, 90, 92],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withWorkflow(nextConfig)
