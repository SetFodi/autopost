import type {
  AnalyticsMetadata,
  InternalAnalyticsPayload,
  PublicAnalyticsEventName,
} from './events'

export async function trackInternalEvent(
  eventName: PublicAnalyticsEventName,
  options: {
    metadata?: AnalyticsMetadata
    submissionId?: string
  } = {},
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const payload: InternalAnalyticsPayload = {
    eventName,
    metadata: options.metadata ?? {},
    ...(options.submissionId ? { submissionId: options.submissionId } : {}),
  }

  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    return response.ok
  } catch {
    // Analytics must never interrupt the upload or WhatsApp flow.
    return false
  }
}
