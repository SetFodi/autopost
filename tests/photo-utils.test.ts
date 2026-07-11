import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { preparePhoto, preparePhotos } from '@/components/forms/photo-utils'
import { MAX_FILE_SIZE_BYTES } from '@/lib/validation/submission'

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

function jpeg(width = 640, height = 480, withPrivateMetadata = false) {
  const metadata = ascii('Exif\0\0GPSLatitude=41.7151;GPSLongitude=44.8271')
  const app1 = withPrivateMetadata
    ? concat(
        Uint8Array.from([
          0xff,
          0xe1,
          ((metadata.length + 2) >>> 8) & 0xff,
          (metadata.length + 2) & 0xff,
        ]),
        metadata,
      )
    : new Uint8Array()
  const frame = Uint8Array.from([
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
  return concat(Uint8Array.from([0xff, 0xd8]), app1, frame)
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

function heif(width = 640, height = 480) {
  const ftyp = box('ftyp', ascii('heic'), u32be(0), ascii('mif1'))
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

function imageFile(bytes: Uint8Array, name: string, type: string) {
  const copy = Uint8Array.from(bytes)
  return new File([copy.buffer], name, {
    type,
    lastModified: 1_700_000_000_000,
  })
}

function readBlobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

const originalImageDecode = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'decode',
)
const originalNaturalWidth = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'naturalWidth',
)
const originalNaturalHeight = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'naturalHeight',
)
const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

function restoreProperty(
  target: object,
  key: string,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) Object.defineProperty(target, key, descriptor)
  else delete (target as Record<string, unknown>)[key]
}

function installImageElementDecoder(options: {
  width?: number
  height?: number
  reject?: boolean
}) {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test-photo'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn(() =>
      options.reject
        ? Promise.reject(new Error('unsupported'))
        : Promise.resolve(),
    ),
  })
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    get: () => options.width ?? 640,
  })
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
    configurable: true,
    get: () => options.height ?? 480,
  })
}

describe('client photo metadata sanitization', () => {
  let drawImage: ReturnType<typeof vi.fn>
  let bitmapClose: ReturnType<typeof vi.fn>
  let canvasSizes: Array<{ width: number; height: number }>

  beforeEach(() => {
    drawImage = vi.fn()
    bitmapClose = vi.fn()
    canvasSizes = []

    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 640,
        height: 480,
        close: bitmapClose,
      })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function toBlob(
        this: HTMLCanvasElement,
        callback: BlobCallback,
        type?: string,
      ) {
        canvasSizes.push({ width: this.width, height: this.height })
        callback(new Blob([`sanitized:${type}`], { type }))
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    restoreProperty(HTMLImageElement.prototype, 'decode', originalImageDecode)
    restoreProperty(
      HTMLImageElement.prototype,
      'naturalWidth',
      originalNaturalWidth,
    )
    restoreProperty(
      HTMLImageElement.prototype,
      'naturalHeight',
      originalNaturalHeight,
    )
    restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl)
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
  })

  it('re-encodes even a small JPEG instead of returning EXIF/GPS source bytes', async () => {
    const source = imageFile(jpeg(640, 480, true), 'car.jpg', 'image/jpeg')

    const prepared = await preparePhoto(source)

    expect(prepared.metadataSanitized).toBe(true)
    expect(prepared.file).not.toBe(source)
    expect(prepared.file.type).toBe('image/jpeg')
    expect(await readBlobText(prepared.file)).not.toMatch(/Exif|GPSLatitude/)
    expect(createImageBitmap).toHaveBeenCalledTimes(1)
    expect(bitmapClose).toHaveBeenCalledTimes(1)
  })

  it('uses orientation-aware decode dimensions and bounds the output canvas', async () => {
    vi.mocked(createImageBitmap).mockResolvedValueOnce({
      width: 2250,
      height: 3000,
      close: bitmapClose,
    } as unknown as ImageBitmap)

    await preparePhoto(
      imageFile(jpeg(4000, 3000), 'portrait.jpg', 'image/jpeg'),
    )

    expect(createImageBitmap).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        imageOrientation: 'from-image',
        resizeWidth: 3000,
        resizeHeight: 2250,
        resizeQuality: 'high',
      }),
    )
    expect(drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 0, 2250, 3000)
    expect(canvasSizes[0]).toEqual({ width: 2250, height: 3000 })
  })

  it.each([
    ['PNG', png(), 'car.png', 'image/png'],
    ['WEBP', webp(), 'car.webp', 'image/webp'],
  ] as const)(
    'sanitizes browser-decodable %s without a raw-file bypass',
    async (_label, bytes, name, type) => {
      const prepared = await preparePhoto(imageFile(bytes, name, type))

      expect(prepared.file.type).toBe(type)
      expect(prepared.metadataSanitized).toBe(true)
      expect(createImageBitmap).toHaveBeenCalledTimes(1)
    },
  )

  it('falls back to alpha-preserving WEBP when sanitized PNG exceeds 12 MiB', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(
      function toBlob(_callback: BlobCallback, type?: string) {
        _callback(
          type === 'image/png'
            ? ({
                size: MAX_FILE_SIZE_BYTES + 1,
                type: 'image/png',
              } as Blob)
            : new Blob(['webp-clean'], { type }),
        )
      },
    )

    const prepared = await preparePhoto(
      imageFile(png(), 'large.png', 'image/png'),
    )

    expect(prepared.file.type).toBe('image/webp')
    expect(prepared.file.name).toBe('large.webp')
  })

  it('converts decodable HEIC to sanitized JPEG', async () => {
    const prepared = await preparePhoto(
      imageFile(heif(), 'iphone.heic', 'image/heic'),
    )

    expect(prepared).toMatchObject({ metadataSanitized: true })
    expect(prepared.file.type).toBe('image/jpeg')
    expect(prepared.file.name).toBe('iphone.jpg')
  })

  it('rejects HEIC clearly when the browser cannot guarantee sanitization', async () => {
    vi.mocked(createImageBitmap).mockRejectedValueOnce(
      new Error('unsupported HEIC'),
    )
    installImageElementDecoder({ reject: true })

    const promise = preparePhoto(imageFile(heif(), 'iphone.heic', 'image/heic'))

    await expect(promise).rejects.toMatchObject({
      code: 'heic_unsupported',
      message: expect.stringContaining('JPG, PNG ან WEBP'),
    })
  })

  it('uses the browser image-element fallback for ordinary decodable photos', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    installImageElementDecoder({ width: 480, height: 640 })

    const prepared = await preparePhoto(
      imageFile(jpeg(), 'fallback.jpg', 'image/jpeg'),
    )

    expect(prepared.metadataSanitized).toBe(true)
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(HTMLImageElement),
      0,
      0,
      480,
      640,
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-photo')
  })

  it('refuses an unbounded full-resolution fallback decode', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    installImageElementDecoder({ width: 8000, height: 6000 })

    await expect(
      preparePhoto(imageFile(jpeg(8000, 6000), 'huge.jpg', 'image/jpeg')),
    ).rejects.toMatchObject({
      code: 'decode_too_large',
    })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('prepares a multi-photo batch sequentially to cap decoded-image memory', async () => {
    let resolveFirst: ((value: ImageBitmap) => void) | undefined
    vi.mocked(createImageBitmap)
      .mockImplementationOnce(
        () =>
          new Promise<ImageBitmap>((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce({
        width: 640,
        height: 480,
        close: vi.fn(),
      } as unknown as ImageBitmap)

    const promise = preparePhotos([
      imageFile(jpeg(), 'one.jpg', 'image/jpeg'),
      imageFile(jpeg(), 'two.jpg', 'image/jpeg'),
    ])

    await vi.waitFor(() => expect(createImageBitmap).toHaveBeenCalledTimes(1))
    resolveFirst?.({
      width: 640,
      height: 480,
      close: vi.fn(),
    } as unknown as ImageBitmap)

    await expect(promise).resolves.toHaveLength(2)
    expect(createImageBitmap).toHaveBeenCalledTimes(2)
  })
})
