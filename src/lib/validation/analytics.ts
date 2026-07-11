import { z } from 'zod'

import { PUBLIC_ANALYTICS_EVENT_NAMES } from '@/lib/analytics/events'

const metadataValueSchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
])

const analyticsMetadataSchema = z
  .record(z.string().min(1).max(40), metadataValueSchema)
  .refine((metadata) => Object.keys(metadata).length <= 12)

export const publicAnalyticsSchema = z
  .object({
    eventName: z.enum(PUBLIC_ANALYTICS_EVENT_NAMES),
    submissionId: z.uuid().optional(),
    metadata: analyticsMetadataSchema.optional().default({}),
  })
  .strict()

export type PublicAnalyticsInput = z.infer<typeof publicAnalyticsSchema>
