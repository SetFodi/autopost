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

type ServiceOptions = {
  storageError?: boolean
  databaseError?: boolean
  databaseRowAbsentAfterError?: boolean
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

function fileChain() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(async () => ({
      data: STORAGE_PATHS.map((storage_path) => ({ storage_path })),
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

    expect(testService.remove).toHaveBeenCalledWith(STORAGE_PATHS)
    expect(testService.operations).toEqual(['storage', 'database'])
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
    expect(testService.from).toHaveBeenCalledTimes(2)
    expect(testService.operations).toEqual(['storage'])
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
    expect(testService.operations).toEqual(['storage', 'database'])
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
