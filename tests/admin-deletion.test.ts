import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  getServiceSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => serviceMocks)

import { deleteSubmissionPermanently } from '@/lib/admin/delete-submission'

const SUBMISSION_ID = '123e4567-e89b-42d3-a456-426614174000'
const PUBLIC_REFERENCE = 'AP-1234567890'
const STORAGE_PATHS = [
  `submissions/${SUBMISSION_ID}/one.jpg`,
  `submissions/${SUBMISSION_ID}/two.jpg`,
]
const GENERATED_PATH = `generated/${SUBMISSION_ID}/preview/square.png`

type ServiceOptions = {
  storageError?: boolean
  databaseError?: boolean
  databaseRowAbsentAfterError?: boolean
  tombstoneError?: boolean
}

function chain(result: unknown, onResolve?: () => void) {
  const query = {
    select: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => {
      onResolve?.()
      return result
    }),
  }

  return query
}

function fileChain(paths = STORAGE_PATHS) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(async () => ({
      data: paths.map((storage_path) => ({ storage_path })),
      error: null,
    })),
  }

  return query
}

function deletionService(options: ServiceOptions = {}) {
  const operations: string[] = []
  const lookup = chain({
    data: { id: SUBMISSION_ID, public_reference: PUBLIC_REFERENCE },
    error: null,
  })
  const files = fileChain()
  const generatedAssets = fileChain([GENERATED_PATH])
  const deletion = chain(
    options.databaseError
      ? { data: null, error: { code: 'XX000' } }
      : { data: { id: SUBMISSION_ID }, error: null },
    () => operations.push('database'),
  )
  const remove = vi.fn(async () => {
    operations.push('storage')
    return options.storageError
      ? { data: null, error: { message: 'storage unavailable' } }
      : { data: [], error: null }
  })
  const from = vi
    .fn()
    .mockReturnValueOnce(lookup)
    .mockReturnValueOnce(files)
    .mockReturnValueOnce(generatedAssets)
    .mockReturnValueOnce(deletion)

  if (options.databaseError) {
    from.mockReturnValueOnce(
      chain({
        data: options.databaseRowAbsentAfterError
          ? null
          : { id: SUBMISSION_ID },
        error: null,
      }),
    )
  }

  return {
    service: {
      from,
      rpc: vi.fn(async () => {
        operations.push('tombstone')
        return options.tombstoneError
          ? { data: null, error: { code: 'XX000' } }
          : { data: true, error: null }
      }),
      storage: { from: vi.fn(() => ({ remove })) },
    },
    from,
    remove,
    operations,
  }
}

describe('permanent admin submission deletion', () => {
  beforeEach(() => {
    serviceMocks.getServiceSupabaseClient.mockReset()
  })

  it('requires the stored public reference before touching files or rows', async () => {
    const testService = deletionService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(testService.service)

    const result = await deleteSubmissionPermanently({
      id: SUBMISSION_ID,
      confirmation: 'AP-0000000000',
    })

    expect(result).toEqual({
      ok: false,
      stage: 'confirmation',
      storageRemoved: false,
    })
    expect(testService.from).toHaveBeenCalledTimes(1)
    expect(testService.remove).not.toHaveBeenCalled()
  })

  it('removes every tracked private object before deleting the database row', async () => {
    const testService = deletionService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(testService.service)

    await expect(
      deleteSubmissionPermanently({
        id: SUBMISSION_ID,
        confirmation: PUBLIC_REFERENCE,
      }),
    ).resolves.toEqual({ ok: true })

    expect(testService.remove).toHaveBeenNthCalledWith(1, STORAGE_PATHS)
    expect(testService.remove).toHaveBeenNthCalledWith(2, [GENERATED_PATH])
    expect(testService.operations).toEqual([
      'tombstone',
      'storage',
      'storage',
      'database',
    ])
  })

  it('leaves all database rows intact when Storage deletion fails', async () => {
    const testService = deletionService({ storageError: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(testService.service)

    const result = await deleteSubmissionPermanently({
      id: SUBMISSION_ID,
      confirmation: PUBLIC_REFERENCE,
    })

    expect(result).toEqual({
      ok: false,
      stage: 'storage',
      storageRemoved: false,
    })
    expect(testService.from).toHaveBeenCalledTimes(3)
    expect(testService.operations).toEqual(['tombstone', 'storage'])
  })

  it('reports a safely retryable partial failure after Storage succeeds', async () => {
    const testService = deletionService({ databaseError: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(testService.service)

    const result = await deleteSubmissionPermanently({
      id: SUBMISSION_ID,
      confirmation: PUBLIC_REFERENCE,
    })

    expect(result).toEqual({
      ok: false,
      stage: 'database',
      storageRemoved: true,
    })
    expect(testService.operations).toEqual([
      'tombstone',
      'storage',
      'storage',
      'database',
    ])
  })

  it('recognizes a committed delete when only its response failed', async () => {
    const testService = deletionService({
      databaseError: true,
      databaseRowAbsentAfterError: true,
    })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(testService.service)

    await expect(
      deleteSubmissionPermanently({
        id: SUBMISSION_ID,
        confirmation: PUBLIC_REFERENCE,
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('fails closed before any lookup when privileged configuration is absent', async () => {
    serviceMocks.getServiceSupabaseClient.mockImplementation(() => {
      throw new Error('missing secret')
    })

    await expect(
      deleteSubmissionPermanently({
        id: SUBMISSION_ID,
        confirmation: PUBLIC_REFERENCE,
      }),
    ).resolves.toEqual({
      ok: false,
      stage: 'configuration',
      storageRemoved: false,
    })
  })
})
