import 'server-only'

import { PassThrough } from 'node:stream'

import { ZipArchive, type ArchiverError } from 'archiver'

import { GENERATED_BUCKET } from '@/lib/fulfillment/config'
import type { GeneratedAssetKind } from '@/lib/fulfillment/types'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'

const REQUIRED_PAID_ASSETS: GeneratedAssetKind[] = [
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
]

export async function createPaidPackage(submissionId: string) {
  const service = getServiceSupabaseClient()
  const { data: assets, error } = await service
    .from('generated_assets')
    .select('asset_kind, filename, storage_path')
    .eq('submission_id', submissionId)
    .eq('access_tier', 'paid')
    .neq('asset_kind', 'package')
    .order('asset_kind', { ascending: true })

  const availableKinds = new Set(assets?.map((asset) => asset.asset_kind))
  if (
    error ||
    !assets ||
    !REQUIRED_PAID_ASSETS.every((kind) => availableKinds.has(kind))
  ) {
    throw new Error('paid_assets_incomplete')
  }

  const output = new PassThrough()
  const chunks: Buffer[] = []
  const completed = new Promise<Buffer>((resolve, reject) => {
    output.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    output.on('end', () => resolve(Buffer.concat(chunks)))
    output.on('error', reject)
  })
  const archive = new ZipArchive({ zlib: { level: 1 } })
  archive.on('error', (archiveError: ArchiverError) =>
    output.destroy(archiveError),
  )
  archive.pipe(output)

  for (const asset of assets) {
    const { data, error: downloadError } = await service.storage
      .from(GENERATED_BUCKET)
      .download(asset.storage_path)
    if (downloadError || !data) throw new Error('paid_asset_download_failed')
    archive.append(Buffer.from(await data.arrayBuffer()), {
      name: asset.filename,
    })
  }

  await archive.finalize()
  const buffer = await completed
  const storagePath = `generated/${submissionId}/paid/package.zip`
  const filename = 'AutoPost-publish-ready-package.zip'
  const { error: uploadError } = await service.storage
    .from(GENERATED_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: '31536000',
      contentType: 'application/zip',
      upsert: true,
    })
  if (uploadError) throw new Error('package_upload_failed')

  const { error: rowError } = await service.from('generated_assets').upsert(
    {
      access_tier: 'paid',
      asset_kind: 'package',
      file_size: buffer.byteLength,
      filename,
      mime_type: 'application/zip',
      storage_path: storagePath,
      submission_id: submissionId,
    },
    { onConflict: 'submission_id,access_tier,asset_kind' },
  )
  if (rowError) throw new Error('package_record_failed')

  return { assetCount: assets.length, fileSize: buffer.byteLength }
}
