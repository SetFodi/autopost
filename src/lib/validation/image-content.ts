import type { AllowedImageMimeType } from './submission'

export const IMAGE_VALIDATION_PREFIX_BYTES = 256 * 1024
export const MAX_IMAGE_DIMENSION = 20_000
export const MAX_IMAGE_PIXELS = 100_000_000

export type ImageContentValidationResult =
  | {
      valid: true
      mimeType: AllowedImageMimeType
      width: number
      height: number
    }
  | {
      valid: false
      reason: 'invalid_signature' | 'malformed_image' | 'unsafe_dimensions'
    }

type Dimensions = { width: number; height: number }

function matches(bytes: Uint8Array, offset: number, expected: number[]) {
  return expected.every((byte, index) => bytes[offset + index] === byte)
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length))
}

function uint16be(bytes: Uint8Array, offset: number) {
  return bytes[offset]! * 0x100 + bytes[offset + 1]!
}

function uint24le(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset]! + bytes[offset + 1]! * 0x100 + bytes[offset + 2]! * 0x10000
  )
}

function uint32be(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset]! * 0x1000000 +
    bytes[offset + 1]! * 0x10000 +
    bytes[offset + 2]! * 0x100 +
    bytes[offset + 3]!
  )
}

function uint32le(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset]! +
    bytes[offset + 1]! * 0x100 +
    bytes[offset + 2]! * 0x10000 +
    bytes[offset + 3]! * 0x1000000
  )
}

function dimensionsAreSafe({ width, height }: Dimensions) {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_IMAGE_DIMENSION &&
    height <= MAX_IMAGE_DIMENSION &&
    width * height <= MAX_IMAGE_PIXELS
  )
}

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

function parseJpeg(bytes: Uint8Array, totalSize: number): Dimensions | null {
  if (bytes.length < 4 || !matches(bytes, 0, [0xff, 0xd8, 0xff])) return null

  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) return null

    const marker = bytes[offset]!
    offset += 1

    if (marker === 0x00 || marker === 0xd9 || marker === 0xda) return null
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue
    if (offset + 2 > bytes.length) return null

    const segmentLength = uint16be(bytes, offset)
    if (segmentLength < 2 || offset + segmentLength > totalSize) return null

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 11 || offset + 8 > bytes.length) return null
      const components = bytes[offset + 7]!
      if (components === 0 || segmentLength !== 8 + components * 3) return null
      return {
        height: uint16be(bytes, offset + 3),
        width: uint16be(bytes, offset + 5),
      }
    }

    if (offset + segmentLength > bytes.length) return null
    offset += segmentLength
  }

  return null
}

function crc32(bytes: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index]!
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function parsePng(bytes: Uint8Array, totalSize: number): Dimensions | null {
  if (
    bytes.length < 33 ||
    totalSize < 33 ||
    !matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ||
    uint32be(bytes, 8) !== 13 ||
    ascii(bytes, 12, 4) !== 'IHDR' ||
    crc32(bytes, 12, 29) !== uint32be(bytes, 29)
  ) {
    return null
  }

  const bitDepth = bytes[24]!
  const colorType = bytes[25]!
  const allowedBitDepths: Record<number, number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  }
  if (
    !allowedBitDepths[colorType]?.includes(bitDepth) ||
    bytes[26] !== 0 ||
    bytes[27] !== 0 ||
    (bytes[28] !== 0 && bytes[28] !== 1)
  ) {
    return null
  }

  return { width: uint32be(bytes, 16), height: uint32be(bytes, 20) }
}

function parseWebp(bytes: Uint8Array, totalSize: number): Dimensions | null {
  if (
    bytes.length < 25 ||
    totalSize < 25 ||
    ascii(bytes, 0, 4) !== 'RIFF' ||
    ascii(bytes, 8, 4) !== 'WEBP' ||
    uint32le(bytes, 4) !== totalSize - 8
  ) {
    return null
  }

  const chunkType = ascii(bytes, 12, 4)
  const chunkSize = uint32le(bytes, 16)
  if (chunkSize === 0 || 20 + chunkSize + (chunkSize & 1) > totalSize)
    return null

  if (chunkType === 'VP8 ') {
    if (
      chunkSize < 10 ||
      bytes.length < 30 ||
      !matches(bytes, 23, [0x9d, 0x01, 0x2a])
    ) {
      return null
    }
    return {
      width: uint16be(new Uint8Array([bytes[27]!, bytes[26]!]), 0) & 0x3fff,
      height: uint16be(new Uint8Array([bytes[29]!, bytes[28]!]), 0) & 0x3fff,
    }
  }

  if (chunkType === 'VP8L') {
    if (chunkSize < 5 || bytes.length < 25 || bytes[20] !== 0x2f) return null
    const b0 = bytes[21]!
    const b1 = bytes[22]!
    const b2 = bytes[23]!
    const b3 = bytes[24]!
    if (b3 >>> 5 !== 0) return null
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + (b1 >>> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
    }
  }

  if (chunkType === 'VP8X') {
    if (chunkSize !== 10 || bytes.length < 30 || (bytes[20]! & 0xc1) !== 0) {
      return null
    }
    return {
      width: 1 + uint24le(bytes, 24),
      height: 1 + uint24le(bytes, 27),
    }
  }

  return null
}

type IsoBox = {
  type: string
  dataStart: number
  end: number
  availableEnd: number
}

function readIsoBox(
  bytes: Uint8Array,
  offset: number,
  parentEnd: number,
): IsoBox | null {
  if (offset + 8 > bytes.length) return null
  const size32 = uint32be(bytes, offset)
  const type = ascii(bytes, offset + 4, 4)
  let headerSize = 8
  let size = size32

  if (size32 === 1) {
    if (offset + 16 > bytes.length) return null
    const high = uint32be(bytes, offset + 8)
    const low = uint32be(bytes, offset + 12)
    size = high * 0x100000000 + low
    headerSize = 16
  } else if (size32 === 0) {
    size = parentEnd - offset
  }

  if (
    !Number.isSafeInteger(size) ||
    size < headerSize ||
    offset + size > parentEnd
  ) {
    return null
  }

  return {
    type,
    dataStart: offset + headerSize,
    end: offset + size,
    availableEnd: Math.min(offset + size, bytes.length),
  }
}

function childBoxes(
  bytes: Uint8Array,
  start: number,
  parentEnd: number,
): IsoBox[] | null {
  const boxes: IsoBox[] = []
  let offset = start
  const availableEnd = Math.min(parentEnd, bytes.length)

  while (offset < availableEnd) {
    if (offset + 8 > availableEnd)
      return parentEnd > bytes.length ? boxes : null
    const box = readIsoBox(bytes, offset, parentEnd)
    if (!box) return null
    boxes.push(box)
    if (box.end > bytes.length) break
    offset = box.end
  }

  return boxes
}

const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
])

function parseHeif(bytes: Uint8Array, totalSize: number): Dimensions | null {
  const ftyp = readIsoBox(bytes, 0, totalSize)
  if (
    !ftyp ||
    ftyp.type !== 'ftyp' ||
    ftyp.end > bytes.length ||
    ftyp.end - ftyp.dataStart < 8 ||
    (ftyp.end - ftyp.dataStart) % 4 !== 0
  ) {
    return null
  }

  const brands: string[] = []
  brands.push(ascii(bytes, ftyp.dataStart, 4))
  for (let offset = ftyp.dataStart + 8; offset + 4 <= ftyp.end; offset += 4) {
    brands.push(ascii(bytes, offset, 4))
  }
  if (
    brands.includes('avif') ||
    brands.includes('avis') ||
    !brands.some((brand) => HEIF_BRANDS.has(brand))
  ) {
    return null
  }

  const topLevel = childBoxes(bytes, ftyp.end, totalSize)
  if (!topLevel) return null

  const dimensions: Dimensions[] = []
  for (const meta of topLevel.filter((box) => box.type === 'meta')) {
    if (meta.dataStart + 4 > meta.availableEnd || bytes[meta.dataStart] !== 0) {
      return null
    }
    const metaChildren = childBoxes(bytes, meta.dataStart + 4, meta.end)
    if (!metaChildren) return null
    for (const iprp of metaChildren.filter((box) => box.type === 'iprp')) {
      const propertyChildren = childBoxes(bytes, iprp.dataStart, iprp.end)
      if (!propertyChildren) return null
      for (const ipco of propertyChildren.filter(
        (box) => box.type === 'ipco',
      )) {
        const properties = childBoxes(bytes, ipco.dataStart, ipco.end)
        if (!properties) return null
        for (const ispe of properties.filter((box) => box.type === 'ispe')) {
          if (
            ispe.end - ispe.dataStart < 12 ||
            ispe.dataStart + 12 > ispe.availableEnd ||
            bytes[ispe.dataStart] !== 0
          ) {
            return null
          }
          dimensions.push({
            width: uint32be(bytes, ispe.dataStart + 4),
            height: uint32be(bytes, ispe.dataStart + 8),
          })
        }
      }
    }
  }

  if (
    dimensions.length === 0 ||
    dimensions.some((item) => !dimensionsAreSafe(item))
  ) {
    return null
  }

  return dimensions.reduce((largest, item) =>
    item.width * item.height > largest.width * largest.height ? item : largest,
  )
}

export function validateImageContent(input: {
  bytes: Uint8Array
  declaredMimeType: AllowedImageMimeType
  totalSize: number
}): ImageContentValidationResult {
  const { bytes, declaredMimeType, totalSize } = input
  if (
    !Number.isSafeInteger(totalSize) ||
    totalSize <= 0 ||
    bytes.length === 0 ||
    bytes.length > IMAGE_VALIDATION_PREFIX_BYTES ||
    bytes.length > totalSize
  ) {
    return { valid: false, reason: 'malformed_image' }
  }

  let dimensions: Dimensions | null
  switch (declaredMimeType) {
    case 'image/jpeg':
      dimensions = parseJpeg(bytes, totalSize)
      break
    case 'image/png':
      dimensions = parsePng(bytes, totalSize)
      break
    case 'image/webp':
      dimensions = parseWebp(bytes, totalSize)
      break
    case 'image/heic':
    case 'image/heif':
      dimensions = parseHeif(bytes, totalSize)
      break
  }

  if (!dimensions) {
    return { valid: false, reason: 'invalid_signature' }
  }
  if (!dimensionsAreSafe(dimensions)) {
    return { valid: false, reason: 'unsafe_dimensions' }
  }

  return { valid: true, mimeType: declaredMimeType, ...dimensions }
}
