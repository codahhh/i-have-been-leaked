/**
 * Minimal HTTP helper with hard deadlines.
 *
 * Returns a discriminated outcome instead of throwing so that callers must
 * explicitly decide what an error means — this is how we guarantee that a
 * provider failure can never be turned into a "clean" result.
 */

export type HttpOutcome =
  | {
      kind: 'response'
      status: number
      headers: Headers
      body: string
      durationMs: number
    }
  | { kind: 'timeout'; durationMs: number }
  | { kind: 'network_error'; detail: string; durationMs: number }

export interface HttpOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
  timeoutMs: number
  /** Absolute timestamp (ms) after which the request must be abandoned. */
  deadline?: number
}

export const DEFAULT_JSON_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'i-have-been-leaked/1.0',
} as const

export async function fetchWithTimeout(
  url: string,
  options: HttpOptions,
): Promise<HttpOutcome> {
  const startedAt = Date.now()
  const remainingFromDeadline =
    typeof options.deadline === 'number' ? options.deadline - startedAt : Infinity
  const timeoutMs = Math.max(250, Math.min(options.timeoutMs, remainingFromDeadline))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        ...DEFAULT_JSON_HEADERS,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body,
      signal: controller.signal,
      // Never let a CDN or undici cache a personal lookup result.
      cache: 'no-store',
      redirect: 'follow',
    })

    const body = await response.text()
    return {
      kind: 'response',
      status: response.status,
      headers: response.headers,
      body,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const durationMs = Date.now() - startedAt
    // `instanceof Error` is not reliable for DOMException across runtimes.
    const name =
      typeof error === 'object' && error !== null && 'name' in error
        ? String((error as { name?: unknown }).name)
        : ''
    if (name === 'AbortError' || name === 'TimeoutError') {
      return { kind: 'timeout', durationMs }
    }
    return {
      kind: 'network_error',
      detail: error instanceof Error ? error.message : 'network failure',
      durationMs,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Parses `Retry-After` (delay-seconds or HTTP-date) into seconds. */
export function parseRetryAfter(headers: Headers): number | null {
  const raw = headers.get('retry-after')
  if (!raw) return null
  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && asNumber >= 0) return Math.ceil(asNumber)
  const date = Date.parse(raw)
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000))
  }
  return null
}

export function safeJsonParse(body: string): unknown | null {
  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*  Tolerant readers for third-party payloads                                 */
/* -------------------------------------------------------------------------- */

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function pickString(
  record: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

export function pickNumber(
  record: Record<string, unknown> | null,
  keys: string[],
): number | null {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value)
  }
  return null
}

/** Splits `"Emails;Passwords,IP addresses"` into a clean, de-duplicated list. */
export function splitList(value: string | null): string[] {
  if (!value) return []
  return uniqueStrings(
    value
      .split(/[;,|]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && part.length <= 64),
  )
}

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.filter((item): item is string => typeof item === 'string').map((s) => s.trim()),
    )
  }
  if (typeof value === 'string') return splitList(value)
  return []
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

/**
 * Finds the first array of objects among several candidate paths in an
 * unknown payload. Third-party APIs change shape without notice, so every
 * parser goes through this instead of hard-coding one response layout.
 */
export function findObjectArray(
  payload: unknown,
  candidates: string[][],
): Record<string, unknown>[] | null {
  for (const path of candidates) {
    let cursor: unknown = payload
    for (const segment of path) {
      const record = asRecord(cursor)
      if (!record) {
        cursor = undefined
        break
      }
      cursor = record[segment]
    }
    if (Array.isArray(cursor)) {
      const objects = cursor.filter(
        (item): item is Record<string, unknown> => asRecord(item) !== null,
      )
      if (objects.length > 0) return objects
      // An explicitly empty array is meaningful: the provider found nothing.
      return []
    }
  }
  return null
}
