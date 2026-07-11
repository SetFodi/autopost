import type { AnalyticsEventName, Json } from '@/types/database'

export const PUBLIC_ANALYTICS_EVENT_NAMES = [
  'landing_view',
  'primary_cta_click',
  'form_started',
  'photo_added',
  'whatsapp_clicked',
] as const satisfies readonly AnalyticsEventName[]

export type PublicAnalyticsEventName =
  (typeof PUBLIC_ANALYTICS_EVENT_NAMES)[number]

export type AnalyticsMetadata = Record<string, string | number | boolean | null>

export type InternalAnalyticsPayload = {
  eventName: PublicAnalyticsEventName
  submissionId?: string
  metadata?: AnalyticsMetadata
}

export function toAnalyticsJson(metadata: AnalyticsMetadata): Json {
  return metadata
}
