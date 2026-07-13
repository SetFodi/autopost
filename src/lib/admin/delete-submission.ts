import 'server-only'

import { GENERATED_BUCKET } from '@/lib/fulfillment/config'
import { getServiceSupabaseClient } from '@/lib/supabase/admin'
import { SUBMISSION_BUCKET } from '@/lib/validation/submission'

export type DeleteSubmissionResult =
  | { ok: true }
  | {
      ok: false
      stage:
        | 'configuration'
        | 'lookup'
        | 'confirmation'
        | 'tombstone'
        | 'storage'
        | 'database'
      storageRemoved: boolean
    }

export type DeleteSubmissionActionState = {
  kind: 'idle' | 'error'
  message: string
  storageRemoved: boolean
}

type DeleteSubmissionInput = {
  id: string
  confirmation: string
}

/**
 * Permanently removes one submission without ever orphaning private objects.
 *
 * Storage must be removed through its API (never by mutating storage.objects).
 * The final submissions DELETE is one Postgres statement, so its existing
 * foreign keys atomically cascade submission_files and detach non-sensitive
 * analytics rows. If that statement fails after Storage succeeds, retrying is
 * safe: removing already-absent objects is idempotent and the DB row remains.
 */
export async function deleteSubmissionPermanently({
  id,
  confirmation,
}: DeleteSubmissionInput): Promise<DeleteSubmissionResult> {
  let service: ReturnType<typeof getServiceSupabaseClient>

  try {
    service = getServiceSupabaseClient()
  } catch (error) {
    console.error('[admin/delete] service configuration unavailable', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return { ok: false, stage: 'configuration', storageRemoved: false }
  }

  let submissionResult
  try {
    submissionResult = await service
      .from('submissions')
      .select('id, public_reference')
      .eq('id', id)
      .maybeSingle()
  } catch {
    console.error('[admin/delete] submission lookup threw')
    return { ok: false, stage: 'lookup', storageRemoved: false }
  }

  if (submissionResult.error) {
    console.error('[admin/delete] submission lookup failed', {
      code: submissionResult.error.code,
    })
    return { ok: false, stage: 'lookup', storageRemoved: false }
  }

  if (!submissionResult.data) {
    // Idempotent retry after a response was lost: there is nothing left to
    // delete, so the requested final state is already satisfied.
    return { ok: true }
  }

  if (submissionResult.data.public_reference !== confirmation) {
    return { ok: false, stage: 'confirmation', storageRemoved: false }
  }

  let filesResult
  let generatedAssetsResult
  try {
    ;[filesResult, generatedAssetsResult] = await Promise.all([
      service
        .from('submission_files')
        .select('storage_path')
        .eq('submission_id', id),
      service
        .from('generated_assets')
        .select('storage_path')
        .eq('submission_id', id),
    ])
  } catch {
    console.error('[admin/delete] file lookup threw')
    return { ok: false, stage: 'lookup', storageRemoved: false }
  }

  if (filesResult.error || generatedAssetsResult.error) {
    console.error('[admin/delete] file lookup failed', {
      code: filesResult.error?.code ?? generatedAssetsResult.error?.code,
    })
    return { ok: false, stage: 'lookup', storageRemoved: false }
  }

  const sourcePaths = (filesResult.data ?? []).map((file) => file.storage_path)
  const generatedPaths = (generatedAssetsResult.data ?? []).map(
    (file) => file.storage_path,
  )

  const { data: tombstoned, error: tombstoneError } = await service.rpc(
    'create_submission_deletion_tombstone',
    { p_submission_id: id },
  )
  if (tombstoneError || !tombstoned) {
    console.error('[admin/delete] deletion tombstone failed', {
      code: tombstoneError?.code,
    })
    return { ok: false, stage: 'tombstone', storageRemoved: false }
  }

  for (const [bucket, paths] of [
    [SUBMISSION_BUCKET, sourcePaths],
    [GENERATED_BUCKET, generatedPaths],
  ] as const) {
    if (paths.length > 0) {
      try {
        const { error } = await service.storage.from(bucket).remove(paths)

        if (error) {
          console.error('[admin/delete] storage removal failed', { bucket })
          return { ok: false, stage: 'storage', storageRemoved: false }
        }
      } catch {
        console.error('[admin/delete] storage removal threw', { bucket })
        return { ok: false, stage: 'storage', storageRemoved: false }
      }
    }
  }

  let deleteResult
  try {
    deleteResult = await service
      .from('submissions')
      .delete()
      .eq('id', id)
      .eq('public_reference', confirmation)
      .select('id')
      .maybeSingle()
  } catch {
    console.error('[admin/delete] database deletion threw')
    deleteResult = null
  }

  if (deleteResult?.error) {
    console.error('[admin/delete] database deletion failed', {
      code: deleteResult.error.code,
    })
  }

  if (deleteResult?.data) return { ok: true }

  // A response can be lost after Postgres commits. Verify the final state
  // before reporting a partial failure, so a completed deletion is never
  // presented as failed merely because its response did not reach Vercel.
  try {
    const { data: remaining, error } = await service
      .from('submissions')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!error && !remaining) return { ok: true }

    console.error('[admin/delete] database deletion was not confirmed', {
      code: error?.code,
    })
  } catch {
    console.error('[admin/delete] database deletion verification threw')
  }

  return { ok: false, stage: 'database', storageRemoved: true }
}
