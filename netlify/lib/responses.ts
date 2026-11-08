/**
 * HTTP plumbing shared by every function: security headers, origin checks,
 * body size limits and typed error responses.
 */

import type { ApiError } from '../../src/types/index'
import { LIMITS } from './config'

export const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  // Personal lookups must never be stored by a browser, proxy or CDN.
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

export function json(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...JSON_HEADERS, ...init.headers },
  })
}

export function apiError(
  status: number,
  error: ApiError,
  headers: Record<string, string> = {},
): Response {
  return json({ ok: false, error }, { status, headers })
}

export function methodNotAllowed(allow: string): Response {
  return apiError(
    405,
    { code: 'method_not_allowed', message: 'Method not allowed.' },
    { Allow: allow },
  )
}

export function notFound(): Response {
  return apiError(404, { code: 'invalid_request', message: 'Unknown endpoint.' })
}

/**
 * Rejects cross-origin browser calls to the JSON API.
 *
 * There are no cookies in this application, so this is not CSRF defence —
 * it stops other sites from silently using our provider quota (and their
 * users' addresses) through our function.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  // Same-origin navigations and server-to-server calls have no Origin header.
  if (!origin) return true
  if (origin === 'null') return false

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  const requestHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  if (requestHost && originHost === requestHost) return true

  const isLocal = (host: string) =>
    host.startsWith('localhost:') || host.startsWith('127.0.0.1:') || host === 'localhost'

  return isLocal(originHost) && (requestHost === '' || isLocal(requestHost))
}

export type BodyResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; response: Response }

export async function readJsonBody(request: Request): Promise<BodyResult> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > LIMITS.maxBodyBytes) {
    return {
      ok: false,
      response: apiError(413, { code: 'invalid_request', message: 'Payload too large.' }),
    }
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return {
      ok: false,
      response: apiError(400, { code: 'invalid_request', message: 'Unreadable body.' }),
    }
  }

  if (raw.length > LIMITS.maxBodyBytes) {
    return {
      ok: false,
      response: apiError(413, { code: 'invalid_request', message: 'Payload too large.' }),
    }
  }

  if (raw.trim().length === 0) {
    return {
      ok: false,
      response: apiError(400, { code: 'invalid_request', message: 'Empty body.' }),
    }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        ok: false,
        response: apiError(400, { code: 'invalid_request', message: 'Body must be an object.' }),
      }
    }
    return { ok: true, value: parsed as Record<string, unknown> }
  } catch {
    return {
      ok: false,
      response: apiError(400, { code: 'invalid_request', message: 'Invalid JSON.' }),
    }
  }
}
