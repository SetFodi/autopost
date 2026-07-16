import { describe, expect, it } from 'vitest'

import { publicSubmissionFormSchema } from '@/components/forms/submission-form-schema'
import {
  MAX_FILE_SIZE_BYTES,
  submissionInitSchema,
  type AllowedImageMimeType,
} from '@/lib/validation/submission'

function files(
  count: number,
  options: {
    mimeType?: AllowedImageMimeType | 'application/pdf'
    fileSize?: number
  } = {},
) {
  return Array.from({ length: count }, (_, index) => ({
    originalFilename: `vehicle-${index + 1}.jpg`,
    mimeType: options.mimeType ?? 'image/jpeg',
    fileSize: options.fileSize ?? 2_000_000,
    sortOrder: index,
  }))
}

function validPayload() {
  return {
    phone: '+995 (555) 12-34-56',
    sellerType: 'dealer',
    customerName: 'ნინო',
    vehicleModel: 'Mercedes-Benz GLE 450 4MATIC',
    vehicleYear: '2022',
    price: '42500',
    priceCurrency: 'USD',
    mileage: '38000',
    engine: '3.0 Turbo',
    transmission: 'ავტომატიკა',
    location: 'თბილისი',
    additionalInfo: 'სერვისის სრული ისტორია.',
    consentGiven: true,
    website: '',
    utmSource: 'facebook',
    utmMedium: 'paid_social',
    utmCampaign: 'first-validation',
    utmContent: 'reel-a',
    utmTerm: 'cars',
    files: files(3),
  }
}

describe('submissionInitSchema', () => {
  it('normalizes and coerces a valid submission', () => {
    const result = submissionInitSchema.parse(validPayload())
    expect(result.phone).toBe('+995555123456')
    expect(result.vehicleYear).toBe(2022)
    expect(result.price).toBe(42_500)
    expect(result.priceCurrency).toBe('USD')
    expect(result.mileage).toBe(38_000)
    expect(result.sellerType).toBe('dealer')
    expect(result.utmSource).toBe('facebook')
    expect(result.files).toHaveLength(3)
  })

  it('requires a supported GEL or USD vehicle-price currency', () => {
    expect(publicSubmissionFormSchema.parse(validPayload()).priceCurrency).toBe(
      'USD',
    )

    const payload = { ...validPayload(), priceCurrency: 'EUR' }
    expect(publicSubmissionFormSchema.safeParse(payload).success).toBe(false)
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('requires the core vehicle fields', () => {
    const payload = validPayload()
    payload.vehicleModel = ''
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('requires a supported seller type', () => {
    const missing = { ...validPayload(), sellerType: undefined }
    expect(publicSubmissionFormSchema.safeParse(missing).success).toBe(false)
    expect(submissionInitSchema.safeParse(missing).success).toBe(false)

    const invalid = { ...validPayload(), sellerType: 'broker' }
    expect(publicSubmissionFormSchema.safeParse(invalid).success).toBe(false)
    expect(submissionInitSchema.safeParse(invalid).success).toBe(false)
  })

  it('accepts bounded optional UTM attribution', () => {
    expect(submissionInitSchema.parse(validPayload())).toMatchObject({
      utmSource: 'facebook',
      utmMedium: 'paid_social',
      utmCampaign: 'first-validation',
      utmContent: 'reel-a',
      utmTerm: 'cars',
    })

    expect(
      submissionInitSchema.safeParse({
        ...validPayload(),
        utmCampaign: 'x'.repeat(201),
      }).success,
    ).toBe(false)
  })

  it('requires consent', () => {
    const payload = { ...validPayload(), consentGiven: false }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('enforces the minimum photo count', () => {
    const payload = { ...validPayload(), files: files(2) }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('enforces the maximum photo count', () => {
    const payload = { ...validPayload(), files: files(16) }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an unsupported MIME type', () => {
    const payload = {
      ...validPayload(),
      files: files(3, { mimeType: 'application/pdf' }),
    }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an oversized individual file', () => {
    const payload = {
      ...validPayload(),
      files: files(3, { fileSize: MAX_FILE_SIZE_BYTES + 1 }),
    }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an oversized total while every file is individually valid', () => {
    const payload = {
      ...validPayload(),
      files: files(11, { fileSize: MAX_FILE_SIZE_BYTES }),
    }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects duplicate sort positions', () => {
    const duplicateOrder = files(3)
    duplicateOrder[2]!.sortOrder = 1
    const payload = { ...validPayload(), files: duplicateOrder }
    expect(submissionInitSchema.safeParse(payload).success).toBe(false)
  })
})
