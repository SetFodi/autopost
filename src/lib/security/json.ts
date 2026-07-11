import 'server-only'

export class InvalidJsonRequestError extends Error {
  constructor() {
    super('Invalid JSON request.')
    this.name = 'InvalidJsonRequestError'
  }
}

export async function readLimitedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/json')) {
    throw new InvalidJsonRequestError()
  }

  const declaredLength = Number.parseInt(
    request.headers.get('content-length') ?? '',
    10,
  )
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new InvalidJsonRequestError()
  }

  const body = await request.text()
  if (!body || new TextEncoder().encode(body).byteLength > maximumBytes) {
    throw new InvalidJsonRequestError()
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    throw new InvalidJsonRequestError()
  }
}
