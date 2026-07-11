import { describe, expect, it } from 'vitest'

import {
  IMAGE_VALIDATION_PREFIX_BYTES,
  validateImageContent,
} from '@/lib/validation/image-content'
import type { AllowedImageMimeType } from '@/lib/validation/submission'

function concat(...parts: Uint8Array[]) {
  const result = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  )
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function ascii(value: string) {
  return Uint8Array.from(value, (character) => character.charCodeAt(0))
}

function u32be(value: number) {
  return Uint8Array.from([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ])
}

function u32le(value: number) {
  return Uint8Array.from([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ])
}

function box(type: string, ...payload: Uint8Array[]) {
  const body = concat(...payload)
  return concat(u32be(body.length + 8), ascii(type), body)
}

function jpeg(width = 640, height = 480) {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >>> 8) & 0xff,
    height & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
  ])
}

function png() {
  return Uint8Array.from(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  )
}

function webp(width = 640, height = 480) {
  const vp8x = concat(
    ascii('VP8X'),
    u32le(10),
    Uint8Array.from([0, 0, 0, 0]),
    Uint8Array.from([
      (width - 1) & 0xff,
      ((width - 1) >>> 8) & 0xff,
      ((width - 1) >>> 16) & 0xff,
      (height - 1) & 0xff,
      ((height - 1) >>> 8) & 0xff,
      ((height - 1) >>> 16) & 0xff,
    ]),
  )
  return concat(ascii('RIFF'), u32le(vp8x.length + 4), ascii('WEBP'), vp8x)
}

function heif(width = 640, height = 480, brand = 'heic') {
  const ftyp = box('ftyp', ascii(brand), u32be(0), ascii('mif1'))
  const ispe = box(
    'ispe',
    Uint8Array.from([0, 0, 0, 0]),
    u32be(width),
    u32be(height),
  )
  const meta = box(
    'meta',
    Uint8Array.from([0, 0, 0, 0]),
    box('iprp', box('ipco', ispe)),
  )
  return concat(ftyp, meta)
}

function validate(bytes: Uint8Array, declaredMimeType: AllowedImageMimeType) {
  return validateImageContent({
    bytes,
    declaredMimeType,
    totalSize: bytes.length,
  })
}

describe('validateImageContent', () => {
  it.each([
    ['JPEG', jpeg(), 'image/jpeg', 640, 480],
    ['PNG', png(), 'image/png', 1, 1],
    ['WebP', webp(), 'image/webp', 640, 480],
    ['HEIC', heif(), 'image/heic', 640, 480],
    ['HEIF', heif(800, 600, 'mif1'), 'image/heif', 800, 600],
  ] as const)(
    'accepts valid %s headers',
    (_name, bytes, mime, width, height) => {
      expect(validate(bytes, mime)).toEqual({
        valid: true,
        mimeType: mime,
        width,
        height,
      })
    },
  )

  it('rejects a payload whose bytes do not match its declared MIME type', () => {
    expect(validate(png(), 'image/jpeg')).toEqual({
      valid: false,
      reason: 'invalid_signature',
    })
  })

  it('rejects malformed image structure after a valid signature', () => {
    const corruptedPng = png()
    corruptedPng[29] ^= 0xff

    expect(validate(corruptedPng, 'image/png')).toEqual({
      valid: false,
      reason: 'invalid_signature',
    })
    expect(
      validate(Uint8Array.from([0xff, 0xd8, 0xff, 0xc0]), 'image/jpeg').valid,
    ).toBe(false)
  })

  it('rejects decompression-bomb dimensions', () => {
    expect(validate(jpeg(50_000, 4_000), 'image/jpeg')).toEqual({
      valid: false,
      reason: 'unsafe_dimensions',
    })
    expect(validate(webp(16_000, 16_000), 'image/webp')).toEqual({
      valid: false,
      reason: 'unsafe_dimensions',
    })
  })

  it('rejects AVIF content disguised as HEIF', () => {
    expect(validate(heif(640, 480, 'avif'), 'image/heif').valid).toBe(false)
  })

  it('refuses an unbounded validation buffer', () => {
    const oversized = new Uint8Array(IMAGE_VALIDATION_PREFIX_BYTES + 1)
    expect(
      validateImageContent({
        bytes: oversized,
        declaredMimeType: 'image/jpeg',
        totalSize: oversized.length,
      }),
    ).toEqual({ valid: false, reason: 'malformed_image' })
  })
})
