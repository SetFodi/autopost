import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_SIZE_BYTES,
} from '@/lib/validation/submission'

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/webp'])
const COMPRESSION_THRESHOLD_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 3000
export const MAX_RAW_IMAGE_SIZE_BYTES = 30 * 1024 * 1024

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

export function withReliableMimeType(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = EXTENSION_MIME_TYPES[extension]
  const type = file.type.toLowerCase() || inferredType

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

export async function preparePhoto(file: File) {
  const typedFile = withReliableMimeType(file)
  if (
    typedFile.size < COMPRESSION_THRESHOLD_BYTES ||
    !COMPRESSIBLE_TYPES.has(typedFile.type) ||
    typeof createImageBitmap !== 'function'
  ) {
    return typedFile
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(typedFile)
    const longestSide = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return typedFile

    context.drawImage(bitmap, 0, 0, width, height)
    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })
    if (!compressedBlob || compressedBlob.size >= typedFile.size * 0.96)
      return typedFile

    const baseName = typedFile.name.replace(/\.[^.]+$/, '')
    return new File([compressedBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: typedFile.lastModified,
    })
  } catch {
    return typedFile
  } finally {
    bitmap?.close()
  }
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
