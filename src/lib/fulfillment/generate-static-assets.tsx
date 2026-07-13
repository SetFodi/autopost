import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import React from 'react'
import satori from 'satori'
import sharp from 'sharp'

import { createMarketingCopy } from '@/lib/fulfillment/copy'
import { GENERATED_BUCKET } from '@/lib/fulfillment/config'
import { createContainedPhotoLayers } from '@/lib/fulfillment/media-framing'
import type {
  AssetAccessTier,
  CreativeSubmission,
  GeneratedAssetKind,
} from '@/lib/fulfillment/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { MIN_PHOTO_COUNT, SUBMISSION_BUCKET } from '@/lib/validation/submission'

const FONT_GEORGIAN = join(
  process.cwd(),
  'node_modules/@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff',
)
const FONT_LATIN = join(
  process.cwd(),
  'node_modules/@fontsource/noto-sans-georgian/files/noto-sans-georgian-latin-700-normal.woff',
)
const DOWNLOAD_TIMEOUT_MS = 20_000
const SIGNED_SOURCE_TTL_SECONDS = 60 * 60

type GeneratedBuffer = {
  kind: GeneratedAssetKind
  filename: string
  mimeType: 'image/png' | 'text/plain; charset=utf-8'
  buffer: Buffer
}

type CardOptions = {
  width: number
  height: number
  photo: Buffer
  submission: CreativeSubmission
  watermarked: boolean
  eyebrow: string
}

let fontsPromise: Promise<{ georgian: Buffer; latin: Buffer }> | null = null

async function getFonts() {
  fontsPromise ??= Promise.all([
    readFile(FONT_GEORGIAN),
    readFile(FONT_LATIN),
  ]).then(([georgian, latin]) => ({ georgian, latin }))
  return fontsPromise
}

function priceLabel(submission: CreativeSubmission) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(submission.price)} ${submission.price_currency}`
}

function dataUri(buffer: Buffer, mimeType: 'image/jpeg' | 'image/png') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

async function renderCard({
  width,
  height,
  photo,
  submission,
  watermarked,
  eyebrow,
}: CardOptions) {
  const [photoLayers, fonts] = await Promise.all([
    createContainedPhotoLayers(photo, width, height),
    getFonts(),
  ])
  const backgroundImage = dataUri(photoLayers.background, 'image/jpeg')
  const foregroundImage = dataUri(photoLayers.foreground, 'image/png')
  const inset = Math.round(width * 0.055)
  const titleSize = Math.round(width * (height > width ? 0.07 : 0.064))

  const svg = await satori(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0c0b0a',
        color: '#f4eee4',
        fontFamily: 'AutoPost Georgian, AutoPost Latin',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={backgroundImage}
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(12,11,10,.2)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={foregroundImage}
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, objectFit: 'contain' }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(180deg, rgba(12,11,10,.16) 18%, rgba(12,11,10,.03) 46%, rgba(12,11,10,.96) 100%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          inset,
          border: `${Math.max(2, Math.round(width / 420))}px solid rgba(244,238,228,.35)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: inset * 1.5,
          left: inset * 1.5,
          right: inset * 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: Math.round(width * 0.027),
          letterSpacing: '0.13em',
        }}
      >
        <span style={{ color: '#ffbe5c' }}>AUTOPOST / GE</span>
        <span>{eyebrow}</span>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: inset * 1.5,
          right: inset * 1.5,
          bottom: inset * 1.5,
          flexDirection: 'column',
          gap: Math.round(width * 0.022),
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: Math.round(width * 0.028),
            color: '#ffbe5c',
            letterSpacing: '0.1em',
          }}
        >
          {submission.vehicle_year} · იყიდება
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: '92%',
            fontSize: titleSize,
            lineHeight: 1.03,
            letterSpacing: '-0.045em',
          }}
        >
          {submission.vehicle_model}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(244,238,228,.35)',
            paddingTop: Math.round(width * 0.025),
            fontSize: Math.round(width * 0.035),
          }}
        >
          <span>{priceLabel(submission)}</span>
          <span style={{ fontSize: Math.round(width * 0.022), opacity: 0.82 }}>
            {submission.phone}
          </span>
        </div>
      </div>
      {watermarked ? (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-18deg)',
            color: 'rgba(255,255,255,.58)',
            fontSize: Math.round(width * 0.084),
            letterSpacing: '0.12em',
            textShadow: '0 2px 20px rgba(0,0,0,.5)',
          }}
        >
          AUTOPOST PREVIEW
        </div>
      ) : null}
    </div>,
    {
      width,
      height,
      fonts: [
        {
          name: 'AutoPost Georgian',
          data: fonts.georgian,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'AutoPost Latin',
          data: fonts.latin,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
}

async function downloadSource(url: string) {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), DOWNLOAD_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: abortController.signal,
    })
    if (!response.ok) throw new Error('source_download_failed')
    return Buffer.from(await response.arrayBuffer())
  } finally {
    clearTimeout(timeout)
  }
}

async function loadCreativeInput(submissionId: string) {
  const service = getServiceSupabaseClient()
  const [submissionResult, filesResult] = await Promise.all([
    service
      .from('submissions')
      .select(
        'public_reference, phone, vehicle_model, vehicle_year, price, price_currency, mileage, engine, transmission, location, additional_info',
      )
      .eq('id', submissionId)
      .eq('upload_state', 'complete')
      .maybeSingle(),
    service
      .from('submission_files')
      .select('storage_path')
      .eq('submission_id', submissionId)
      .eq('file_type', 'source_photo')
      .order('sort_order', { ascending: true }),
  ])

  if (
    submissionResult.error ||
    filesResult.error ||
    !submissionResult.data ||
    filesResult.data.length < MIN_PHOTO_COUNT
  ) {
    throw new Error('creative_input_unavailable')
  }

  const signedUrls = await Promise.all(
    filesResult.data.map(async (file) => {
      const { data, error } = await service.storage
        .from(SUBMISSION_BUCKET)
        .createSignedUrl(file.storage_path, SIGNED_SOURCE_TTL_SECONDS)
      if (error || !data?.signedUrl) throw new Error('source_signing_failed')
      return data.signedUrl
    }),
  )

  const photos = await Promise.all(signedUrls.slice(0, 5).map(downloadSource))
  return {
    photos,
    signedUrls,
    submission: submissionResult.data as CreativeSubmission,
  }
}

async function storeGeneratedAsset(
  submissionId: string,
  accessTier: AssetAccessTier,
  asset: GeneratedBuffer,
) {
  const service = getServiceSupabaseClient()
  const extension = asset.kind === 'copy' ? 'txt' : 'png'
  const storagePath = `generated/${submissionId}/${accessTier}/${asset.kind}.${extension}`
  const { error: uploadError } = await service.storage
    .from(GENERATED_BUCKET)
    .upload(storagePath, asset.buffer, {
      cacheControl: accessTier === 'paid' ? '31536000' : '3600',
      contentType: asset.kind === 'copy' ? 'text/plain' : asset.mimeType,
      upsert: true,
    })
  if (uploadError) throw new Error('generated_asset_upload_failed')

  const { error: rowError } = await service.from('generated_assets').upsert(
    {
      access_tier: accessTier,
      asset_kind: asset.kind,
      file_size: asset.buffer.byteLength,
      filename: asset.filename,
      mime_type: asset.mimeType,
      storage_path: storagePath,
      submission_id: submissionId,
    },
    { onConflict: 'submission_id,access_tier,asset_kind' },
  )
  if (rowError) throw new Error('generated_asset_record_failed')
}

export async function generateStaticAssetSet(
  submissionId: string,
  accessTier: AssetAccessTier,
) {
  const { photos, signedUrls, submission } =
    await loadCreativeInput(submissionId)
  const watermarked = accessTier === 'preview'
  const storyAssets = await Promise.all(
    Array.from({ length: 3 }, (_, index) => index).map(
      async (index): Promise<GeneratedBuffer> => ({
        kind: `story_${index + 1}` as GeneratedAssetKind,
        filename: `${submission.public_reference}-story-${index + 1}.png`,
        mimeType: 'image/png',
        buffer: await renderCard({
          width: 1080,
          height: 1920,
          photo: photos[(index + 1) % photos.length]!,
          submission,
          watermarked,
          eyebrow: `STORY / 0${index + 1}`,
        }),
      }),
    ),
  )
  const carouselAssets = await Promise.all(
    Array.from({ length: 6 }, (_, index) => index).map(
      async (index): Promise<GeneratedBuffer> => ({
        kind: `carousel_${index + 1}` as GeneratedAssetKind,
        filename: `${submission.public_reference}-carousel-${index + 1}.png`,
        mimeType: 'image/png',
        buffer: await renderCard({
          width: 1080,
          height: 1080,
          photo: photos[index % photos.length]!,
          submission,
          watermarked,
          eyebrow: `CAROUSEL / 0${index + 1}`,
        }),
      }),
    ),
  )
  const assets: GeneratedBuffer[] = [
    {
      kind: 'square',
      filename: `${submission.public_reference}-square.png`,
      mimeType: 'image/png',
      buffer: await renderCard({
        width: 1080,
        height: 1080,
        photo: photos[0]!,
        submission,
        watermarked,
        eyebrow: 'FEED / 01',
      }),
    },
    ...storyAssets,
    ...carouselAssets,
  ]

  assets.push({
    kind: 'copy',
    filename: `${submission.public_reference}-copy-ka-en-ru.txt`,
    mimeType: 'text/plain; charset=utf-8',
    buffer: Buffer.from(createMarketingCopy(submission), 'utf8'),
  })

  await Promise.all(
    assets.map((asset) => storeGeneratedAsset(submissionId, accessTier, asset)),
  )

  return {
    assetCount: assets.length,
    signedSourceUrls: signedUrls,
    submission,
  }
}
