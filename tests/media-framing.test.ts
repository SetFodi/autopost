import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { createContainedPhotoLayers } from '@/lib/fulfillment/media-framing'

describe('createContainedPhotoLayers', () => {
  it('keeps the complete landscape frame inside a vertical canvas', async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 220, g: 30, b: 40 },
      },
    })
      .jpeg()
      .toBuffer()

    const { background, foreground } = await createContainedPhotoLayers(
      source,
      1080,
      1920,
    )
    const backgroundMetadata = await sharp(background).metadata()
    const foregroundImage = sharp(foreground).ensureAlpha()
    const foregroundMetadata = await foregroundImage.metadata()
    const pixels = await foregroundImage.raw().toBuffer()
    const topAlpha = pixels[Math.floor(1080 / 2) * 4 + 3]
    const centerOffset = (Math.floor(1920 / 2) * 1080 + 540) * 4

    expect(backgroundMetadata).toMatchObject({ width: 1080, height: 1920 })
    expect(foregroundMetadata).toMatchObject({ width: 1080, height: 1920 })
    expect(topAlpha).toBe(0)
    expect(pixels[centerOffset]).toBeGreaterThan(180)
    expect(pixels[centerOffset + 3]).toBe(255)
  })
})
