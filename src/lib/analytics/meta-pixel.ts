type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  loaded: boolean
  push: (...args: unknown[]) => void
  queue: unknown[][]
  version: string
}

declare global {
  interface Window {
    _fbq?: MetaPixelFunction
    fbq?: MetaPixelFunction
    __autoPostMetaPixelId?: string
  }
}

const SCRIPT_ID = 'autopost-meta-pixel'
const LEAD_STORAGE_PREFIX = 'autopost:meta-lead:'
const fallbackLeadReferences = new Set<string>()

export type MetaSellerType = 'private_seller' | 'dealer'

function getPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null
}

function installPixelQueue(): MetaPixelFunction {
  if (window.fbq) return window.fbq

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
    } else {
      fbq.queue.push(args)
    }
  }) as MetaPixelFunction

  fbq.push = (...args: unknown[]) => fbq(...args)
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  return fbq
}

function loadPixelScript() {
  if (document.getElementById(SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

/** Installs Meta's queue and initializes the configured Pixel once. */
export function initializeMetaPixel(): boolean {
  const pixelId = getPixelId()
  if (!pixelId || typeof window === 'undefined') return false

  if (window.__autoPostMetaPixelId === pixelId) return true

  const fbq = installPixelQueue()
  loadPixelScript()
  fbq('init', pixelId)
  window.__autoPostMetaPixelId = pixelId
  return true
}

function getInitializedPixel(): MetaPixelFunction | null {
  if (!initializeMetaPixel()) return null
  return window.fbq ?? null
}

/** Records a PageView for every public client-side navigation. */
export function trackMetaPageView(): boolean {
  const fbq = getInitializedPixel()
  if (!fbq) return false
  fbq('track', 'PageView')
  return true
}

export function trackMetaFormStarted(): boolean {
  const fbq = getInitializedPixel()
  if (!fbq) return false
  fbq('trackCustom', 'FormStarted')
  return true
}

function hasRecordedLead(publicReference: string): boolean {
  if (fallbackLeadReferences.has(publicReference)) return true

  try {
    return (
      localStorage.getItem(`${LEAD_STORAGE_PREFIX}${publicReference}`) === '1'
    )
  } catch {
    return false
  }
}

function rememberLead(publicReference: string) {
  fallbackLeadReferences.add(publicReference)
  try {
    localStorage.setItem(`${LEAD_STORAGE_PREFIX}${publicReference}`, '1')
  } catch {
    // Private browsing/storage restrictions still retain in-memory dedupe.
  }
}

/**
 * Records Lead only after /complete succeeds. Persistent reference-based
 * deduplication prevents a success-screen refresh from firing it again.
 */
export function trackMetaLeadOnce(
  publicReference: string,
  sellerType?: MetaSellerType,
): boolean {
  if (!publicReference || hasRecordedLead(publicReference)) return false

  const fbq = getInitializedPixel()
  if (!fbq) return false

  fbq('track', 'Lead', {
    content_category: 'vehicle_preview',
    content_name: 'AutoPost for Cars',
    ...(sellerType ? { seller_type: sellerType } : {}),
  })
  rememberLead(publicReference)
  return true
}
