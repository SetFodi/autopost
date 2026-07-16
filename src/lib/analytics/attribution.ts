export type CampaignAttribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

const STORAGE_KEY = 'autopost:campaign-attribution'
const MAX_VALUE_LENGTH = 200
const UNSAFE_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g

const ATTRIBUTION_FIELDS = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
  ['utm_term', 'utmTerm'],
] as const satisfies ReadonlyArray<readonly [string, keyof CampaignAttribution]>

function sanitizeValue(value: string): string | undefined {
  const sanitized = value
    .normalize('NFKC')
    .replace(UNSAFE_CONTROL_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_VALUE_LENGTH)
    .trim()

  return sanitized || undefined
}

function sanitizeStoredAttribution(value: unknown): CampaignAttribution {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const record = value as Record<string, unknown>
  const attribution: CampaignAttribution = {}

  for (const [, field] of ATTRIBUTION_FIELDS) {
    const rawValue = record[field]
    if (typeof rawValue !== 'string') continue

    const sanitized = sanitizeValue(rawValue)
    if (sanitized) attribution[field] = sanitized
  }

  return attribution
}

function persistCampaignAttribution(attribution: CampaignAttribution) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // Attribution is best-effort and must never block the landing or form flow.
  }
}

export function getCampaignAttribution(): CampaignAttribution {
  if (typeof window === 'undefined') return {}

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return sanitizeStoredAttribution(JSON.parse(stored) as unknown)
  } catch {
    return {}
  }
}

/**
 * Captures the latest tagged landing URL for this browser tab. An untagged
 * navigation keeps the existing attribution so hash links and form progress
 * cannot erase the campaign that brought the visitor to AutoPost.
 */
export function captureCampaignAttribution(): CampaignAttribution {
  if (typeof window === 'undefined') return {}

  const parameters = new URLSearchParams(window.location.search)
  const captured: CampaignAttribution = {}

  for (const [parameter, field] of ATTRIBUTION_FIELDS) {
    const rawValue = parameters.get(parameter)
    if (rawValue === null) continue

    const sanitized = sanitizeValue(rawValue)
    if (sanitized) captured[field] = sanitized
  }

  if (Object.keys(captured).length === 0) {
    return getCampaignAttribution()
  }

  persistCampaignAttribution(captured)
  return captured
}
