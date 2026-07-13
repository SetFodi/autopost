import sharp from 'sharp'

export type ContainedPhotoLayers = {
  background: Buffer
  foreground: Buffer
}

export async function createContainedPhotoLayers(
  photo: Buffer,
  width: number,
  height: number,
): Promise<ContainedPhotoLayers> {
  const blurSigma = Math.max(14, Math.round(Math.min(width, height) / 52))

  const [background, foreground] = await Promise.all([
    sharp(photo, { failOn: 'error' })
      .rotate()
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .blur(blurSigma)
      .modulate({ brightness: 0.54, saturation: 0.72 })
      .flatten({ background: '#0c0b0a' })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer(),
    sharp(photo, { failOn: 'error' })
      .rotate()
      .resize(width, height, {
        fit: 'contain',
        background: { r: 12, g: 11, b: 10, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ])

  return { background, foreground }
}
