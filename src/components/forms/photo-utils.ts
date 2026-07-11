import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_SIZE_BYTES,
  type AllowedImageMimeType,
} from '@/lib/validation/submission'
import {
  IMAGE_VALIDATION_PREFIX_BYTES,
  validateImageContent,
} from '@/lib/validation/image-content'

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const MAX_IMAGE_DIMENSION = 3000
const MAX_FALLBACK_DECODE_PIXELS = 40_000_000
const LOSSY_QUALITIES = [0.92, 0.86, 0.8] as const
export const MAX_RAW_IMAGE_SIZE_BYTES = 30 * 1024 * 1024

type CanvasOutputMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

type OutputCandidate = {
  mimeType: CanvasOutputMimeType
  quality?: number
}

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export type PreparedPhoto = {
  file: File
  metadataSanitized: true
}

export type PhotoPreparationErrorCode =
  | 'invalid_image'
  | 'unsafe_dimensions'
  | 'decode_too_large'
  | 'heic_unsupported'
  | 'decode_failed'
  | 'sanitize_failed'

export class PhotoPreparationError extends Error {
  constructor(
    public readonly code: PhotoPreparationErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PhotoPreparationError'
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

export function withReliableMimeType(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = EXTENSION_MIME_TYPES[extension]
  const declaredType = file.type.toLowerCase()
  const type = ALLOWED_IMAGE_MIME_TYPES.includes(
    declaredType as AllowedImageMimeType,
  )
    ? declaredType
    : (inferredType ?? declaredType)

  if (!type || type === file.type) return file
  return new File([file], file.name, { type, lastModified: file.lastModified })
}

export function validateRawPhotos(files: File[]) {
  const invalidType = files.find(
    (file) =>
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        withReliableMimeType(file)
          .type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      ),
  )
  if (invalidType) {
    return 'დასაშვებია მხოლოდ JPG, JPEG, PNG, WEBP და HEIC/HEIF ფოტოები.'
  }

  const oversized = files.find((file) => file.size > MAX_RAW_IMAGE_SIZE_BYTES)
  if (oversized) {
    return `${oversized.name} აჭარბებს ${formatBytes(MAX_RAW_IMAGE_SIZE_BYTES)}-იან საწყის ლიმიტს.`
  }

  return null
}

export function validatePreparedPhotos(files: File[], existingFiles: File[]) {
  const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES)
  if (oversized) {
    return `${oversized.name} დამუშავების შემდეგაც აჭარბებს ${formatBytes(MAX_FILE_SIZE_BYTES)}-იან ლიმიტს.`
  }

  const totalSize = [...existingFiles, ...files].reduce(
    (sum, file) => sum + file.size,
    0,
  )
  if (totalSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
    return `ფოტოების საერთო ზომა არ უნდა აღემატებოდეს ${formatBytes(MAX_TOTAL_UPLOAD_SIZE_BYTES)}-ს.`
  }

  return null
}

function preparationError(
  code: PhotoPreparationErrorCode,
  file: File,
): PhotoPreparationError {
  switch (code) {
    case 'invalid_image':
      return new PhotoPreparationError(
        code,
        `${file.name} დაზიანებულია ან მისი რეალური ფორმატი არ ემთხვევა გაფართოებას.`,
      )
    case 'unsafe_dimensions':
      return new PhotoPreparationError(
        code,
        `${file.name}-ის ზომები უსაფრთხო დამუშავების ზღვარს აჭარბებს. აირჩიე უფრო მცირე ფოტო.`,
      )
    case 'decode_too_large':
      return new PhotoPreparationError(
        code,
        `${file.name} ამ ბრაუზერში უსაფრთხოდ დასამუშავებლად ზედმეტად მაღალი გარჩევადობისაა. შეამცირე ფოტო ან გამოიყენე თანამედროვე ბრაუზერი.`,
      )
    case 'heic_unsupported':
      return new PhotoPreparationError(
        code,
        `${file.name}: ამ ბრაუზერს HEIC/HEIF ფოტოდან პირადი მეტამონაცემების უსაფრთხოდ მოცილება არ შეუძლია. გადააკეთე JPG, PNG ან WEBP ფორმატში და თავიდან აირჩიე.`,
      )
    case 'decode_failed':
      return new PhotoPreparationError(
        code,
        `${file.name} ბრაუზერმა ვერ გახსნა. გადააკეთე JPG, PNG ან WEBP ფორმატში და თავიდან აირჩიე.`,
      )
    case 'sanitize_failed':
      return new PhotoPreparationError(
        code,
        `${file.name}-დან პირადი მეტამონაცემების უსაფრთხოდ მოცილება ვერ დასრულდა. ფოტო არ აიტვირთება; სცადე სხვა ფორმატი ან უფრო მცირე ვერსია.`,
      )
  }
}

export function getPhotoPreparationErrorMessage(error: unknown) {
  return error instanceof PhotoPreparationError
    ? error.message
    : 'ფოტოების უსაფრთხოდ მომზადება ვერ დასრულდა. არცერთი ახალი ფოტო არ დამატებულა — სცადე თავიდან.'
}

function fittedDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function validatedDimensions(file: File) {
  const prefix = new Uint8Array(
    await file.slice(0, IMAGE_VALIDATION_PREFIX_BYTES).arrayBuffer(),
  )
  const validation = validateImageContent({
    bytes: prefix,
    declaredMimeType: file.type as AllowedImageMimeType,
    totalSize: file.size,
  })

  if (!validation.valid) {
    throw preparationError(
      validation.reason === 'unsafe_dimensions'
        ? 'unsafe_dimensions'
        : 'invalid_image',
      file,
    )
  }

  return { width: validation.width, height: validation.height }
}

async function decodeWithImageBitmap(
  file: File,
  sourceDimensions: { width: number; height: number },
): Promise<DecodedImage | null> {
  if (typeof createImageBitmap !== 'function') return null

  const resize = fittedDimensions(
    sourceDimensions.width,
    sourceDimensions.height,
  )

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
      resizeWidth: resize.width,
      resizeHeight: resize.height,
      resizeQuality: 'high',
    })
    if (bitmap.width < 1 || bitmap.height < 1) {
      bitmap.close()
      return null
    }

    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  } catch {
    return null
  }
}

async function decodeWithImageElement(
  file: File,
): Promise<DecodedImage | null> {
  if (
    typeof document === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return null
  }

  const objectUrl = URL.createObjectURL(file)
  const image = document.createElement('img')
  image.decoding = 'async'
  image.src = objectUrl

  try {
    if (typeof image.decode === 'function') {
      await image.decode()
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Image decode failed.'))
      })
    }

    if (image.naturalWidth < 1 || image.naturalHeight < 1) {
      URL.revokeObjectURL(objectUrl)
      return null
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectUrl),
    }
  } catch {
    URL.revokeObjectURL(objectUrl)
    return null
  }
}

async function decodePhoto(
  file: File,
  sourceDimensions: { width: number; height: number },
) {
  const bitmap = await decodeWithImageBitmap(file, sourceDimensions)
  if (bitmap) return bitmap

  if (
    sourceDimensions.width * sourceDimensions.height >
    MAX_FALLBACK_DECODE_PIXELS
  ) {
    throw preparationError('decode_too_large', file)
  }

  const image = await decodeWithImageElement(file)
  if (image) return image

  throw preparationError(
    file.type === 'image/heic' || file.type === 'image/heif'
      ? 'heic_unsupported'
      : 'decode_failed',
    file,
  )
}

function outputCandidates(
  sourceMimeType: AllowedImageMimeType,
): OutputCandidate[] {
  if (
    sourceMimeType === 'image/jpeg' ||
    sourceMimeType === 'image/heic' ||
    sourceMimeType === 'image/heif'
  ) {
    return LOSSY_QUALITIES.map((quality) => ({
      mimeType: 'image/jpeg',
      quality,
    }))
  }

  if (sourceMimeType === 'image/png') {
    return [
      { mimeType: 'image/png' },
      ...LOSSY_QUALITIES.map((quality) => ({
        mimeType: 'image/webp' as const,
        quality,
      })),
    ]
  }

  return [
    ...LOSSY_QUALITIES.map((quality) => ({
      mimeType: 'image/webp' as const,
      quality,
    })),
    { mimeType: 'image/png' },
  ]
}

function encodeCanvas(canvas: HTMLCanvasElement, candidate: OutputCandidate) {
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (
            !blob ||
            blob.size < 1 ||
            blob.type.toLowerCase() !== candidate.mimeType
          ) {
            resolve(null)
            return
          }
          resolve(blob)
        },
        candidate.mimeType,
        candidate.quality,
      )
    } catch {
      resolve(null)
    }
  })
}

async function sanitizedBlob(file: File, decoded: DecodedImage): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw preparationError('sanitize_failed', file)
  }

  const dimensions = fittedDimensions(decoded.width, decoded.height)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d', { alpha: true })

  if (!context) {
    canvas.width = 0
    canvas.height = 0
    throw preparationError('sanitize_failed', file)
  }

  try {
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.source, 0, 0, dimensions.width, dimensions.height)

    for (const candidate of outputCandidates(
      file.type as AllowedImageMimeType,
    )) {
      const blob = await encodeCanvas(canvas, candidate)
      if (blob && blob.size <= MAX_FILE_SIZE_BYTES) return blob
    }
  } finally {
    // Releasing the backing store matters on mobile when a seller selects 15
    // high-resolution photos in one batch.
    canvas.width = 0
    canvas.height = 0
  }

  throw preparationError('sanitize_failed', file)
}

function extensionForSanitizedMimeType(type: string) {
  switch (type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const typedFile = withReliableMimeType(file)
  const dimensions = await validatedDimensions(typedFile)
  let decoded: DecodedImage | null = null

  try {
    decoded = await decodePhoto(typedFile, dimensions)
    const blob = await sanitizedBlob(typedFile, decoded)
    const baseName = typedFile.name.replace(/\.[^.]+$/, '')
    return {
      file: new File(
        [blob],
        `${baseName}.${extensionForSanitizedMimeType(blob.type)}`,
        {
          type: blob.type,
          lastModified: typedFile.lastModified,
        },
      ),
      metadataSanitized: true,
    }
  } finally {
    decoded?.close()
  }
}

export async function preparePhotos(files: File[]) {
  const prepared: PreparedPhoto[] = []
  // Sequential preparation bounds decoded-pixel and canvas memory even when
  // the native picker returns the 15-photo maximum at once.
  for (const file of files) prepared.push(await preparePhoto(file))
  return prepared
}

export function createPhotoFingerprint(file: File) {
  return `${file.name.toLowerCase()}:${file.size}:${file.lastModified}`
}

export function canPreviewPhoto(file: File) {
  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp'
  )
}
