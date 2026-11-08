/**
 * Thin client for our own JSON API.
 *
 * Every call has a deadline. Failures are normalised into `RequestError` with
 * a machine-readable code, which the UI maps to a translated message — no
 * English-only API text ever reaches the screen.
 */

export type RequestErrorCode =
  | 'network_error'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_response'
  | 'server_error'
  | 'invalid_email'
  | 'consent_required'
  | 'invalid_request'

export class RequestError extends Error {
  readonly code: RequestErrorCode
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(
    code: RequestErrorCode,
    status: number,
    retryAfterSeconds: number | null = null,
    message = code,
  ) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

const STATUS_TO_CODE: Record<number, RequestErrorCode> = {
  400: 'invalid_request',
  403: 'invalid_request',
  404: 'invalid_request',
  405: 'invalid_request',
  413: 'invalid_request',
  429: 'rate_limited',
  502: 'server_error',
  503: 'server_error',
  504: 'server_error',
}

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    retryAfterSeconds?: number
  }
}

function mapCode(status: number, body: ApiErrorBody | null): RequestErrorCode {
  const declared = body?.error?.code
  if (declared === 'invalid_email') return 'invalid_email'
  if (declared === 'consent_required') return 'consent_required'
  if (declared === 'rate_limited') return 'rate_limited'
  if (declared === 'invalid_request' || declared === 'invalid_prefix') return 'invalid_request'
  return STATUS_TO_CODE[status] ?? 'server_error'
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs: number },
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), init.timeoutMs)

  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    throw new RequestError(aborted ? 'timeout' : 'network_error', 0)
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text().catch(() => '')

  if (!response.ok) {
    let body: ApiErrorBody | null = null
    try {
      body = text ? (JSON.parse(text) as ApiErrorBody) : null
    } catch {
      body = null
    }
    const retryAfterHeader = Number(response.headers.get('retry-after'))
    throw new RequestError(
      mapCode(response.status, body),
      response.status,
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader
        : (body?.error?.retryAfterSeconds ?? null),
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new RequestError('invalid_response', response.status)
  }
}

export function getJson<T>(path: string, timeoutMs = 8000): Promise<T> {
  return request<T>(path, { method: 'GET', timeoutMs })
}

export function postJson<T>(path: string, body: unknown, timeoutMs = 12_000): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body), timeoutMs })
}
