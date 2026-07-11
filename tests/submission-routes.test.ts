import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  getServiceSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => serviceMocks)

import { POST as completeSubmission } from '@/app/api/submissions/complete/route'
import { POST as initializeSubmission } from '@/app/api/submissions/init/route'
import { createSubmissionCompletionToken } from '@/lib/security/request'
import { IMAGE_VALIDATION_PREFIX_BYTES } from '@/lib/validation/image-content'

const SUBMISSION_ID = '123e4567-e89b-42d3-a456-426614174000'
const IDEMPOTENCY_KEY = '723e4567-e89b-42d3-a456-426614174000'
const PUBLIC_REFERENCE = 'AP-1234567890'

let streamCancelMocks: Array<ReturnType<typeof vi.fn>> = []

function validJpegBytes() {
  return Uint8Array.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03,
    0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
  ])
}

function pngBytes() {
  return Uint8Array.from(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  )
}

function mockStorageFetch(header = validJpegBytes()) {
  const prefix = new Uint8Array(IMAGE_VALIDATION_PREFIX_BYTES)
  prefix.set(header)

  const fetchMock = vi.fn(async () => {
    const cancel = vi.fn()
    streamCancelMocks.push(cancel)
    let sent = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!sent) {
          controller.enqueue(prefix)
          sent = true
        }
      },
      cancel,
    })
    return new Response(body, { status: 206 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function fileDescriptors() {
  return Array.from({ length: 5 }, (_, index) => ({
    originalFilename: `car-${index + 1}.jpg`,
    mimeType: 'image/jpeg',
    fileSize: 1_000_000 + index,
    sortOrder: index,
  }))
}

function storageRows() {
  return fileDescriptors().map((file, index) => ({
    ...file,
    storage_path: `submissions/${SUBMISSION_ID}/00000000-0000-4000-8000-00000000000${index}.jpg`,
    storagePath: `submissions/${SUBMISSION_ID}/00000000-0000-4000-8000-00000000000${index}.jpg`,
    file_size: file.fileSize,
    mime_type: file.mimeType,
    sort_order: file.sortOrder,
  }))
}

function initBody(website = '') {
  return {
    phone: '+995 555 12 34 56',
    customerName: 'ნინო',
    vehicleModel: 'BMW 330i',
    vehicleYear: 2022,
    price: 42_500,
    priceCurrency: 'GEL',
    mileage: 38_000,
    engine: '2.0 Turbo',
    transmission: 'ავტომატიკა',
    location: 'თბილისი',
    additionalInfo: 'სერვისის ისტორია',
    consentGiven: true,
    website,
    files: fileDescriptors(),
  }
}

function request(path: string, body: unknown, headers: HeadersInit = {}) {
  return new Request(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.42',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

function initService(
  options: {
    capacityExceeded?: boolean
    idempotencyConflict?: boolean
    rateLimited?: boolean
    wasExisting?: boolean
    signedUploadError?: boolean
  } = {},
) {
  const rows = storageRows()
  const rpc = vi.fn().mockResolvedValue(
    options.capacityExceeded
      ? {
          data: null,
          error: { code: 'P0001', message: 'intake_capacity_exceeded' },
        }
      : {
          data: [
            {
              submission_id:
                options.rateLimited || options.idempotencyConflict
                  ? null
                  : SUBMISSION_ID,
              public_reference:
                options.rateLimited || options.idempotencyConflict
                  ? null
                  : PUBLIC_REFERENCE,
              idempotency_conflict: options.idempotencyConflict ?? false,
              rate_limited: options.rateLimited ?? false,
              retry_after_seconds: options.rateLimited ? 900 : 0,
              was_existing: options.wasExisting ?? false,
            },
          ],
          error: null,
        },
  )
  const order = vi.fn().mockResolvedValue({
    data: rows.map((row) => ({
      sort_order: row.sort_order,
      storage_path: row.storage_path,
    })),
    error: null,
  })
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order,
  }
  const createSignedUploadUrl = vi.fn(async (path: string) => ({
    data: options.signedUploadError
      ? null
      : { path, token: `token-${path}`, signedUrl: `https://storage/${path}` },
    error: options.signedUploadError ? new Error('storage unavailable') : null,
  }))

  return {
    rpc,
    from: vi.fn(() => query),
    storage: {
      from: vi.fn(() => ({ createSignedUploadUrl })),
    },
    createSignedUploadUrl,
  }
}

function completeService(
  options: {
    mismatchedSize?: boolean
    alreadyComplete?: boolean
  } = {},
) {
  const rows = storageRows()
  const submissionQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        id: SUBMISSION_ID,
        public_reference: PUBLIC_REFERENCE,
        vehicle_model: 'BMW 330i',
        upload_state: options.alreadyComplete ? 'complete' : 'pending',
        completed_at: options.alreadyComplete ? new Date().toISOString() : null,
        expected_file_count: rows.length,
      },
      error: null,
    }),
  }
  const filesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: rows.map((row) => ({
        file_size: row.file_size,
        mime_type: row.mime_type,
        sort_order: row.sort_order,
        storage_path: row.storage_path,
      })),
      error: null,
    }),
  }
  const info = vi.fn(async (path: string) => {
    const index = rows.findIndex((row) => row.storage_path === path)
    const row = rows[index]!
    return {
      data: {
        size:
          options.mismatchedSize && index === 2
            ? row.file_size + 1
            : row.file_size,
        contentType: row.mime_type,
      },
      error: null,
    }
  })
  const createSignedUrl = vi.fn(async (path: string) => ({
    data: { signedUrl: `https://storage.example.test/${path}?token=signed` },
    error: null,
  }))
  const rpc = vi.fn().mockResolvedValue({
    data: [
      {
        already_complete: false,
        completed_at: new Date().toISOString(),
        photo_count: rows.length,
        public_reference: PUBLIC_REFERENCE,
        vehicle_model: 'BMW 330i',
      },
    ],
    error: null,
  })

  return {
    from: vi.fn((table: string) =>
      table === 'submissions' ? submissionQuery : filesQuery,
    ),
    storage: { from: vi.fn(() => ({ info, createSignedUrl })) },
    rpc,
    info,
    createSignedUrl,
  }
}

function completionBody() {
  return {
    submissionId: SUBMISSION_ID,
    completionToken: createSubmissionCompletionToken(SUBMISSION_ID),
    uploaded: storageRows().map((row) => ({
      fileIndex: row.sort_order,
      path: row.storage_path,
    })),
  }
}

describe('POST /api/submissions/init', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_IP_HASH_SECRET = 'x'.repeat(32)
    delete process.env.SUBMISSION_RATE_LIMIT_MAX
    delete process.env.SUBMISSION_INIT_REQUEST_RATE_LIMIT_MAX
    delete process.env.SUBMISSION_RATE_LIMIT_WINDOW_MINUTES
    serviceMocks.getServiceSupabaseClient.mockReset()
  })

  it('creates an idempotent pending intake and signed upload targets', async () => {
    const service = initService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await initializeSubmission(
      request('/api/submissions/init', initBody(), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      submissionId: SUBMISSION_ID,
      publicReference: PUBLIC_REFERENCE,
      completionToken: expect.stringMatching(/^v1:[a-f0-9]{64}$/),
    })
    expect(body.uploads).toHaveLength(5)
    expect(service.rpc).toHaveBeenCalledWith(
      'begin_submission',
      expect.objectContaining({
        p_phone: '+995555123456',
        p_price_currency: 'GEL',
        p_rate_limit: 3,
        p_request_rate_limit: 30,
        p_submission_id: expect.any(String),
      }),
    )
    expect(service.createSignedUploadUrl).toHaveBeenCalledTimes(5)
  })

  it('rejects a filled honeypot before touching Supabase', async () => {
    const response = await initializeSubmission(
      request('/api/submissions/init', initBody('spam.example'), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(400)
    expect(serviceMocks.getServiceSupabaseClient).not.toHaveBeenCalled()
  })

  it('returns the persisted database rate-limit result and retry delay', async () => {
    const service = initService({ rateLimited: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await initializeSubmission(
      request('/api/submissions/init', initBody(), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('900')
    expect(service.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it('returns a retryable limit response when global intake capacity is full', async () => {
    const service = initService({ capacityExceeded: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await initializeSubmission(
      request('/api/submissions/init', initBody(), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('86400')
    expect(service.createSignedUploadUrl).not.toHaveBeenCalled()
  })

  it('replays the same intake without reporting a second creation', async () => {
    const service = initService({ wasExisting: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await initializeSubmission(
      request('/api/submissions/init', initBody(), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(200)
    expect((await response.json()).submissionId).toBe(SUBMISSION_ID)
  })

  it('returns a committed idempotency conflict without minting upload tokens', async () => {
    const service = initService({ idempotencyConflict: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await initializeSubmission(
      request('/api/submissions/init', initBody(), {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(409)
    expect(service.createSignedUploadUrl).not.toHaveBeenCalled()
  })
})

describe('POST /api/submissions/complete', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_IP_HASH_SECRET = 'x'.repeat(32)
    serviceMocks.getServiceSupabaseClient.mockReset()
    streamCancelMocks = []
    mockStorageFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects an invalid completion capability before privileged reads', async () => {
    const response = await completeSubmission(
      request('/api/submissions/complete', {
        ...completionBody(),
        completionToken: `v1:${'0'.repeat(64)}`,
      }),
    )

    expect(response.status).toBe(400)
    expect(serviceMocks.getServiceSupabaseClient).not.toHaveBeenCalled()
  })

  it('verifies every object before completing the submission', async () => {
    const service = completeService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await completeSubmission(
      request('/api/submissions/complete', completionBody()),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      submissionId: SUBMISSION_ID,
      publicReference: PUBLIC_REFERENCE,
      photoCount: 5,
    })
    expect(service.info).toHaveBeenCalledTimes(5)
    expect(service.createSignedUrl).toHaveBeenCalledTimes(5)
    expect(globalThis.fetch).toHaveBeenCalledTimes(5)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://storage.example.test/'),
      expect.objectContaining({
        cache: 'no-store',
        headers: { Range: `bytes=0-${IMAGE_VALIDATION_PREFIX_BYTES - 1}` },
      }),
    )
    expect(streamCancelMocks).toHaveLength(5)
    expect(
      streamCancelMocks.every((cancel) => cancel.mock.calls.length === 1),
    ).toBe(true)
    expect(service.rpc).toHaveBeenCalledWith(
      'complete_submission',
      expect.objectContaining({ p_submission_id: SUBMISSION_ID }),
    )
  })

  it('keeps the intake incomplete when one stored object does not match', async () => {
    const service = completeService({ mismatchedSize: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await completeSubmission(
      request('/api/submissions/complete', completionBody()),
    )

    expect(response.status).toBe(409)
    expect(service.rpc).not.toHaveBeenCalled()
  })

  it('rejects a stored object whose bytes spoof its declared image type', async () => {
    mockStorageFetch(pngBytes())
    const service = completeService()
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await completeSubmission(
      request('/api/submissions/complete', completionBody()),
    )

    expect(response.status).toBe(409)
    expect(service.createSignedUrl).toHaveBeenCalled()
    expect(service.rpc).not.toHaveBeenCalled()
  })

  it('returns an already-complete intake without writing again', async () => {
    const service = completeService({ alreadyComplete: true })
    serviceMocks.getServiceSupabaseClient.mockReturnValue(service)

    const response = await completeSubmission(
      request('/api/submissions/complete', completionBody()),
    )

    expect(response.status).toBe(200)
    expect(service.info).not.toHaveBeenCalled()
    expect(service.rpc).not.toHaveBeenCalled()
  })
})
