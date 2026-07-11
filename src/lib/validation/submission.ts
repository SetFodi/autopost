import { z } from 'zod'

import { georgianPhoneSchema } from './phone'

export const SUBMISSION_BUCKET = 'vehicle-uploads'
export const MIN_PHOTO_COUNT = 5
export const MAX_PHOTO_COUNT = 15
export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024
export const MAX_TOTAL_UPLOAD_SIZE_BYTES = 120 * 1024 * 1024
export const MAX_SUBMISSION_JSON_BYTES = 64 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

const NO_UNSAFE_CONTROL_CHARACTERS =
  /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} სავალდებულოა.`)
    .max(maxLength, `${label} ძალიან გრძელია.`)
    .regex(NO_UNSAFE_CONTROL_CHARACTERS, `${label} შეიცავს დაუშვებელ სიმბოლოს.`)
}

function optionalText(label: string, maxLength: number) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length === 0
        ? undefined
        : value,
    requiredText(label, maxLength).optional(),
  )
}

function optionalInteger(maximum: number) {
  return z.preprocess(
    (value) =>
      value === '' || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(0).max(maximum).optional(),
  )
}

export const submissionFileMetadataSchema = z
  .object({
    originalFilename: requiredText('ფაილის სახელი', 255),
    mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
      error: 'ფაილის ფორმატი არ არის მხარდაჭერილი.',
    }),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(MAX_FILE_SIZE_BYTES, 'ერთი ფოტო მაქსიმუმ 12 MB უნდა იყოს.'),
    sortOrder: z
      .number()
      .int()
      .min(0)
      .max(MAX_PHOTO_COUNT - 1),
  })
  .strict()

export const submissionInitSchema = z
  .object({
    phone: georgianPhoneSchema,
    customerName: optionalText('სახელი', 100),
    vehicleModel: requiredText('ავტომობილის მარკა და მოდელი', 120).min(
      2,
      'მიუთითეთ ავტომობილის მარკა და მოდელი.',
    ),
    vehicleYear: z.coerce
      .number()
      .int()
      .min(1900, 'მიუთითეთ სწორი გამოშვების წელი.')
      .max(new Date().getFullYear() + 1, 'მიუთითეთ სწორი გამოშვების წელი.'),
    price: z.coerce
      .number()
      .positive('მიუთითეთ ავტომობილის ფასი.')
      .max(100_000_000, 'მიუთითეთ სწორი ფასი.'),
    mileage: optionalInteger(10_000_000),
    engine: optionalText('ძრავი', 80),
    transmission: optionalText('ტრანსმისია', 80),
    location: optionalText('მდებარეობა', 120),
    additionalInfo: optionalText('დამატებითი ინფორმაცია', 2000),
    consentGiven: z.literal(true, {
      error: 'გასაგრძელებლად საჭიროა თანხმობა.',
    }),
    website: z.string().max(500).optional().default(''),
    files: z
      .array(submissionFileMetadataSchema)
      .min(MIN_PHOTO_COUNT, 'ატვირთეთ მინიმუმ 5 ფოტო.')
      .max(MAX_PHOTO_COUNT, 'შეგიძლიათ ატვირთოთ მაქსიმუმ 15 ფოტო.'),
  })
  .strict()
  .superRefine((value, context) => {
    const totalSize = value.files.reduce((sum, file) => sum + file.fileSize, 0)
    if (totalSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
      context.addIssue({
        code: 'custom',
        message: 'ფოტოების საერთო ზომა მაქსიმუმ 120 MB უნდა იყოს.',
        path: ['files'],
      })
    }

    const sortOrders = value.files.map((file) => file.sortOrder)
    if (new Set(sortOrders).size !== sortOrders.length) {
      context.addIssue({
        code: 'custom',
        message: 'ფოტოების რიგითობა არასწორია.',
        path: ['files'],
      })
    }

    const expectedOrders = new Set(value.files.map((_, index) => index))
    if (sortOrders.some((sortOrder) => !expectedOrders.has(sortOrder))) {
      context.addIssue({
        code: 'custom',
        message: 'ფოტოების რიგითობა არასწორია.',
        path: ['files'],
      })
    }
  })

const storagePathSchema = z
  .string()
  .min(1)
  .max(500)
  .regex(
    /^submissions\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp|heic|heif)$/,
  )

export const submissionCompleteSchema = z
  .object({
    submissionId: z.uuid(),
    completionToken: z.string().regex(/^v1:[a-f0-9]{64}$/),
    uploaded: z
      .array(
        z
          .object({
            fileIndex: z
              .number()
              .int()
              .min(0)
              .max(MAX_PHOTO_COUNT - 1),
            path: storagePathSchema,
          })
          .strict(),
      )
      .min(MIN_PHOTO_COUNT)
      .max(MAX_PHOTO_COUNT),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.uploaded.map((file) => file.fileIndex)).size !==
      value.uploaded.length
    ) {
      context.addIssue({ code: 'custom', path: ['uploaded'] })
    }
    if (
      new Set(value.uploaded.map((file) => file.path)).size !==
      value.uploaded.length
    ) {
      context.addIssue({ code: 'custom', path: ['uploaded'] })
    }
  })

export const idempotencyKeySchema = z.uuid()

export type SubmissionInitInput = z.infer<typeof submissionInitSchema>
export type SubmissionCompleteInput = z.infer<typeof submissionCompleteSchema>

export function sanitizeOriginalFilename(filename: string): string {
  const basename = filename.normalize('NFKC').split(/[\\/]/).pop() ?? ''
  const cleaned = basename
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return (cleaned || 'photo').slice(0, 255)
}

export function extensionForMimeType(mimeType: AllowedImageMimeType): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/heic':
      return 'heic'
    case 'image/heif':
      return 'heif'
  }
}
