import type { AwsRegion } from '@remotion/lambda'
import { sleep } from 'workflow'

import {
  GENERATED_BUCKET,
  getRemotionConfig,
  isRemotionConfigured,
} from '@/lib/fulfillment/config'
import { generateStaticAssetSet } from '@/lib/fulfillment/generate-static-assets'
import { createPaidPackage } from '@/lib/fulfillment/package'
import type {
  AssetAccessTier,
  CreativeSubmission,
} from '@/lib/fulfillment/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

type RenderHandle = {
  bucketName: string
  functionName: string
  region: AwsRegion
  renderId: string
}

type RenderInput = {
  signedSourceUrls: string[]
  submission: CreativeSubmission
}

async function generateStaticStep(
  submissionId: string,
  accessTier: AssetAccessTier,
) {
  'use step'
  console.info('[fulfillment/generate-static] enter', {
    accessTier,
    submissionId,
  })
  const result = await generateStaticAssetSet(submissionId, accessTier)
  console.info('[fulfillment/generate-static] exit', {
    accessTier,
    assetCount: result.assetCount,
    submissionId,
  })
  return result
}

async function startReelStep(
  submissionId: string,
  accessTier: AssetAccessTier,
  input: RenderInput,
): Promise<RenderHandle | null> {
  'use step'
  console.info('[fulfillment/start-reel] enter', { accessTier, submissionId })
  if (!isRemotionConfigured()) {
    console.info('[fulfillment/start-reel] exit', {
      accessTier,
      reason: 'remotion_not_configured',
      submissionId,
    })
    return null
  }

  const config = getRemotionConfig()
  const region = config.region as AwsRegion
  const { renderMediaOnLambda } = await import('@remotion/lambda')
  const render = await renderMediaOnLambda({
    codec: 'h264',
    composition: 'AutoPostVehicleReel',
    deleteAfter: '1-day',
    downloadBehavior: { type: 'download', fileName: null },
    functionName: config.functionName,
    imageFormat: 'jpeg',
    inputProps: {
      photos: input.signedSourceUrls,
      phone: input.submission.phone,
      priceLabel: `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(input.submission.price)} ${input.submission.price_currency}`,
      publicReference: input.submission.public_reference,
      vehicleModel: input.submission.vehicle_model,
      vehicleYear: input.submission.vehicle_year,
      watermarked: accessTier === 'preview',
    },
    maxRetries: 2,
    privacy: 'private',
    region,
    serveUrl: config.serveUrl,
  })
  console.info('[fulfillment/start-reel] exit', {
    accessTier,
    renderId: render.renderId,
    submissionId,
  })
  return {
    bucketName: render.bucketName,
    functionName: config.functionName,
    region,
    renderId: render.renderId,
  }
}

async function pollReelStep(handle: RenderHandle) {
  'use step'
  console.info('[fulfillment/poll-reel] enter', { renderId: handle.renderId })
  const { getRenderProgress } = await import('@remotion/lambda')
  const progress = await getRenderProgress(handle)
  if (progress.fatalErrorEncountered || progress.errors.length > 0) {
    throw new Error('reel_render_failed')
  }
  console.info('[fulfillment/poll-reel] exit', {
    done: progress.done,
    progress: progress.overallProgress,
    renderId: handle.renderId,
  })
  return { done: progress.done, outputFile: progress.outputFile }
}

async function storeReelStep(
  submissionId: string,
  accessTier: AssetAccessTier,
  outputFile: string,
) {
  'use step'
  console.info('[fulfillment/store-reel] enter', { accessTier, submissionId })
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 60_000)
  let buffer: Buffer
  try {
    const response = await fetch(outputFile, {
      cache: 'no-store',
      signal: abortController.signal,
    })
    if (!response.ok) throw new Error('reel_download_failed')
    buffer = Buffer.from(await response.arrayBuffer())
  } finally {
    clearTimeout(timeout)
  }

  const service = getServiceSupabaseClient()
  const storagePath = `generated/${submissionId}/${accessTier}/reel.mp4`
  const filename = `AutoPost-${accessTier}-reel.mp4`
  const { error: uploadError } = await service.storage
    .from(GENERATED_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: accessTier === 'paid' ? '31536000' : '3600',
      contentType: 'video/mp4',
      upsert: true,
    })
  if (uploadError) throw new Error('reel_upload_failed')

  const { error: rowError } = await service.from('generated_assets').upsert(
    {
      access_tier: accessTier,
      asset_kind: 'reel',
      file_size: buffer.byteLength,
      filename,
      mime_type: 'video/mp4',
      storage_path: storagePath,
      submission_id: submissionId,
    },
    { onConflict: 'submission_id,access_tier,asset_kind' },
  )
  if (rowError) throw new Error('reel_record_failed')
  console.info('[fulfillment/store-reel] exit', {
    accessTier,
    fileSize: buffer.byteLength,
    submissionId,
  })
}

async function buildPackageStep(submissionId: string) {
  'use step'
  console.info('[fulfillment/package] enter', { submissionId })
  const result = await createPaidPackage(submissionId)
  console.info('[fulfillment/package] exit', { ...result, submissionId })
  return result
}

async function markPreviewReadyStep(submissionId: string) {
  'use step'
  console.info('[fulfillment/preview-ready] enter', { submissionId })
  const service = getServiceSupabaseClient()
  const now = new Date().toISOString()
  const [fulfillmentResult, submissionResult] = await Promise.all([
    service
      .from('fulfillments')
      .update({
        failed_at: null,
        last_error_code: null,
        preview_ready_at: now,
        status: 'preview_ready',
      })
      .eq('submission_id', submissionId),
    service
      .from('submissions')
      .update({ status: 'preview_ready' })
      .eq('id', submissionId)
      .eq('upload_state', 'complete')
      .in('status', ['new', 'in_progress', 'preview_ready']),
  ])
  if (fulfillmentResult.error || submissionResult.error) {
    throw new Error('preview_ready_update_failed')
  }
  console.info('[fulfillment/preview-ready] exit', { submissionId })
}

async function markPaidReadyStep(submissionId: string) {
  'use step'
  console.info('[fulfillment/paid-ready] enter', { submissionId })
  const { error } = await getServiceSupabaseClient()
    .from('fulfillments')
    .update({
      failed_at: null,
      last_error_code: null,
      ready_at: new Date().toISOString(),
      status: 'ready',
    })
    .eq('submission_id', submissionId)
  if (error) throw new Error('paid_ready_update_failed')
  console.info('[fulfillment/paid-ready] exit', { submissionId })
}

async function markFailedStep(
  submissionId: string,
  accessTier: AssetAccessTier,
  errorCode: string,
) {
  'use step'
  console.info('[fulfillment/failed] enter', { errorCode, submissionId })
  const resetRun =
    accessTier === 'preview'
      ? { preview_workflow_run_id: null }
      : { paid_workflow_run_id: null }
  const { error } = await getServiceSupabaseClient()
    .from('fulfillments')
    .update({
      failed_at: new Date().toISOString(),
      last_error_code: errorCode,
      ...resetRun,
      status: 'failed',
    })
    .eq('submission_id', submissionId)
  if (error) throw new Error('failed_state_update_failed')
  console.info('[fulfillment/failed] exit', { errorCode, submissionId })
}

async function renderAndStoreReel(
  submissionId: string,
  accessTier: AssetAccessTier,
  input: RenderInput,
) {
  const handle = await startReelStep(submissionId, accessTier, input)
  if (!handle) return false

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const progress = await pollReelStep(handle)
    if (progress.done && progress.outputFile) {
      await storeReelStep(submissionId, accessTier, progress.outputFile)
      return true
    }
    await sleep('5s')
  }
  throw new Error('reel_render_timeout')
}

export async function previewFulfillmentWorkflow(submissionId: string) {
  'use workflow'
  try {
    const generated = await generateStaticStep(submissionId, 'preview')
    await renderAndStoreReel(submissionId, 'preview', generated)
    await markPreviewReadyStep(submissionId)
    return { status: 'preview_ready' as const }
  } catch (error) {
    await markFailedStep(submissionId, 'preview', 'preview_generation_failed')
    throw error
  }
}

export async function paidFulfillmentWorkflow(submissionId: string) {
  'use workflow'
  try {
    const generated = await generateStaticStep(submissionId, 'paid')
    await renderAndStoreReel(submissionId, 'paid', generated)
    await buildPackageStep(submissionId)
    await markPaidReadyStep(submissionId)
    return { status: 'ready' as const }
  } catch (error) {
    await markFailedStep(submissionId, 'paid', 'paid_generation_failed')
    throw error
  }
}
