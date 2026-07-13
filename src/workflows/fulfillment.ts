import { join } from 'node:path'

import {
  GENERATED_BUCKET,
  isRemotionConfigured,
} from '@/lib/fulfillment/config'
import { generateStaticAssetSet } from '@/lib/fulfillment/generate-static-assets'
import { createPaidPackage } from '@/lib/fulfillment/package'
import type {
  AssetAccessTier,
  CreativeSubmission,
} from '@/lib/fulfillment/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

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

async function renderAndStoreReelStep(
  submissionId: string,
  accessTier: AssetAccessTier,
  input: RenderInput,
): Promise<boolean> {
  'use step'
  console.info('[fulfillment/render-reel] enter', { accessTier, submissionId })
  if (!isRemotionConfigured()) {
    console.info('[fulfillment/render-reel] exit', {
      accessTier,
      reason: 'vercel_sandbox_unavailable',
      submissionId,
    })
    return false
  }

  const { addBundleToSandbox, createSandbox, renderMediaOnVercel } =
    await import('@remotion/vercel')
  const sandbox = await createSandbox({
    timeoutInMilliseconds: 8 * 60 * 1000,
    onProgress: ({ message, progress }) => {
      console.info('[fulfillment/render-reel] sandbox', {
        message,
        progress: Math.round(progress * 100),
        submissionId,
      })
    },
  })

  try {
    await addBundleToSandbox({
      sandbox,
      bundleDir: join(process.cwd(), '.remotion'),
    })
    let lastProgressBucket = -1
    const { contentType, sandboxFilePath } = await renderMediaOnVercel({
      sandbox,
      codec: 'h264',
      compositionId: 'AutoPostVehicleReel',
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
      jpegQuality: 85,
      onProgress: (update) => {
        const progressBucket = Math.floor(update.overallProgress * 4)
        if (progressBucket <= lastProgressBucket) return
        lastProgressBucket = progressBucket
        console.info('[fulfillment/render-reel] render', {
          progress: Math.round(update.overallProgress * 100),
          stage: update.stage,
          submissionId,
        })
      },
      timeoutInMilliseconds: 60_000,
      x264Preset: 'veryfast',
    })
    if (contentType !== 'video/mp4')
      throw new Error('reel_content_type_invalid')

    const buffer = await sandbox.readFileToBuffer({ path: sandboxFilePath })
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('reel_output_unavailable')
    }

    const service = getServiceSupabaseClient()
    const storagePath = `generated/${submissionId}/${accessTier}/reel.mp4`
    const filename = `AutoPost-${accessTier}-reel.mp4`
    const { error: uploadError } = await service.storage
      .from(GENERATED_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: accessTier === 'paid' ? '31536000' : '3600',
        contentType,
        upsert: true,
      })
    if (uploadError) throw new Error('reel_upload_failed')

    const { error: rowError } = await service.from('generated_assets').upsert(
      {
        access_tier: accessTier,
        asset_kind: 'reel',
        file_size: buffer.byteLength,
        filename,
        mime_type: contentType,
        storage_path: storagePath,
        submission_id: submissionId,
      },
      { onConflict: 'submission_id,access_tier,asset_kind' },
    )
    if (rowError) throw new Error('reel_record_failed')
    console.info('[fulfillment/render-reel] exit', {
      accessTier,
      fileSize: buffer.byteLength,
      submissionId,
    })
    return true
  } finally {
    // Sandbox instances are persistent by default. Delete the entire instance
    // so every render is ephemeral and does not leave billable snapshots.
    await sandbox.delete().catch(async () => {
      await sandbox.stop().catch(() => undefined)
    })
  }
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

export async function previewFulfillmentWorkflow(submissionId: string) {
  'use workflow'
  try {
    const generated = await generateStaticStep(submissionId, 'preview')
    await renderAndStoreReelStep(submissionId, 'preview', generated)
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
    await renderAndStoreReelStep(submissionId, 'paid', generated)
    await buildPackageStep(submissionId)
    await markPaidReadyStep(submissionId)
    return { status: 'ready' as const }
  } catch (error) {
    await markFailedStep(submissionId, 'paid', 'paid_generation_failed')
    throw error
  }
}
