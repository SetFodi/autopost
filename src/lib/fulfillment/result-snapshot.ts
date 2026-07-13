import 'server-only'

import {
  GENERATED_BUCKET,
  isCheckoutConfigured,
  RESULT_ASSET_URL_TTL_SECONDS,
} from '@/lib/fulfillment/config'
import type {
  FulfillmentStatus,
  GeneratedAssetKind,
  ResultAsset,
  ResultSnapshot,
} from '@/lib/fulfillment/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

const ASSET_ORDER: GeneratedAssetKind[] = [
  'square',
  'story_1',
  'story_2',
  'story_3',
  'carousel_1',
  'carousel_2',
  'carousel_3',
  'carousel_4',
  'carousel_5',
  'carousel_6',
  'copy',
  'reel',
  'package',
]

export async function getResultSnapshot(
  submissionId: string,
): Promise<ResultSnapshot | null> {
  const service = getServiceSupabaseClient()
  const [submissionResult, fulfillmentResult, paymentResult, assetsResult] =
    await Promise.all([
      service
        .from('submissions')
        .select('public_reference, vehicle_model, vehicle_year, updated_at')
        .eq('id', submissionId)
        .eq('upload_state', 'complete')
        .maybeSingle(),
      service
        .from('fulfillments')
        .select('status, updated_at')
        .eq('submission_id', submissionId)
        .maybeSingle(),
      service
        .from('payments')
        .select('status')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      service
        .from('generated_assets')
        .select('access_tier, asset_kind, filename, mime_type, storage_path')
        .eq('submission_id', submissionId),
    ])

  if (
    submissionResult.error ||
    fulfillmentResult.error ||
    paymentResult.error ||
    assetsResult.error ||
    !submissionResult.data
  ) {
    return null
  }

  const paid = paymentResult.data?.status === 'succeeded'
  const visibleRows = (assetsResult.data ?? []).filter(
    (asset) => asset.access_tier === 'preview' || paid,
  )
  const copyRow =
    visibleRows.find(
      (asset) => asset.access_tier === 'paid' && asset.asset_kind === 'copy',
    ) ??
    visibleRows.find(
      (asset) => asset.access_tier === 'preview' && asset.asset_kind === 'copy',
    )

  const [signedAssets, copyText] = await Promise.all([
    Promise.all(
      visibleRows.map(async (asset): Promise<ResultAsset | null> => {
        const { data, error } = await service.storage
          .from(GENERATED_BUCKET)
          .createSignedUrl(
            asset.storage_path,
            RESULT_ASSET_URL_TTL_SECONDS,
            asset.mime_type === 'application/zip' ||
              asset.mime_type.startsWith('text/')
              ? { download: asset.filename }
              : undefined,
          )
        if (error || !data?.signedUrl) return null
        return Object.assign(
          {
            filename: asset.filename,
            kind: asset.asset_kind,
            mimeType: asset.mime_type,
            url: data.signedUrl,
          },
          { accessTier: asset.access_tier },
        )
      }),
    ),
    (async () => {
      if (!copyRow) return null
      const { data, error } = await service.storage
        .from(GENERATED_BUCKET)
        .download(copyRow.storage_path, {}, { cache: 'no-store' })
      if (error || !data) return null
      return data.text()
    })(),
  ])

  const assets = signedAssets
    .filter(
      (
        asset,
      ): asset is ResultAsset & {
        accessTier: 'preview' | 'paid'
      } => Boolean(asset),
    )
    .sort(
      (left, right) =>
        ASSET_ORDER.indexOf(left.kind) - ASSET_ORDER.indexOf(right.kind),
    )

  return {
    checkoutAvailable:
      isCheckoutConfigured() &&
      visibleRows.some(
        (asset) =>
          asset.access_tier === 'preview' && asset.asset_kind === 'reel',
      ),
    copyText,
    paid,
    paidAssets: paid
      ? assets.filter((asset) => asset.accessTier === 'paid')
      : [],
    paymentStatus: paymentResult.data?.status ?? null,
    previewAssets: assets.filter((asset) => asset.accessTier === 'preview'),
    publicReference: submissionResult.data.public_reference,
    status: (fulfillmentResult.data?.status ?? 'queued') as FulfillmentStatus,
    updatedAt:
      fulfillmentResult.data?.updated_at ?? submissionResult.data.updated_at,
    vehicleModel: submissionResult.data.vehicle_model,
    vehicleYear: submissionResult.data.vehicle_year,
  }
}
