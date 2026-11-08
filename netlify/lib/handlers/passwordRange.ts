/**
 * GET /api/password-range?prefix=ABCDE
 *
 * Server-side fallback for the Pwned Passwords range API.
 *
 * The browser hashes the password locally and normally talks to HIBP
 * directly (that is the primary path — our server never sees anything).
 * This endpoint exists for networks that block the direct call: it receives
 * a five-character SHA-1 prefix, which is not personal data on its own and
 * cannot be reversed. The full hash and the password never leave the browser.
 */

import type { PasswordRangeResponse } from '../../../src/types/index'
import { PWNED_PASSWORDS, RATE_LIMITS } from '../config'
import { fetchWithTimeout } from '../http'
import { safeLog } from '../log'
import { checkRateLimit, clientKey } from '../rateLimit'
import { apiError, isAllowedOrigin, json, methodNotAllowed } from '../responses'
import { isValidSha1Prefix } from '../../../src/utils/validation'

export async function handlePasswordRange(request: Request): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed('GET')
  if (!isAllowedOrigin(request)) {
    return apiError(403, { code: 'invalid_request', message: 'Origin not allowed.' })
  }

  const limit = checkRateLimit(`pw:${clientKey(request)}`, RATE_LIMITS.passwordRange)
  if (!limit.allowed) {
    return apiError(
      429,
      { code: 'rate_limited', message: 'Too many requests.', retryAfterSeconds: limit.retryAfterSeconds },
      { 'Retry-After': String(limit.retryAfterSeconds) },
    )
  }

  const prefix = (new URL(request.url).searchParams.get('prefix') ?? '').toUpperCase()
  if (!isValidSha1Prefix(prefix)) {
    return apiError(400, { code: 'invalid_prefix', message: 'A 5-character hex prefix is required.' })
  }

  const outcome = await fetchWithTimeout(PWNED_PASSWORDS.rangeUrl(prefix), {
    timeoutMs: PWNED_PASSWORDS.timeoutMs,
    headers: {
      // Padding rows with count 0 defeat traffic-size analysis.
      'Add-Padding': 'true',
      Accept: 'text/plain',
    },
  })

  if (outcome.kind === 'timeout') {
    safeLog('warn', 'password range timeout', { provider: 'hibp', code: 'timeout' })
    return apiError(504, { code: 'internal_error', message: 'Upstream timeout.' })
  }

  if (outcome.kind === 'network_error') {
    safeLog('warn', 'password range unreachable', { provider: 'hibp', code: 'network_error' })
    return apiError(502, { code: 'internal_error', message: 'Upstream unreachable.' })
  }

  if (outcome.status === 429) {
    return apiError(
      429,
      { code: 'rate_limited', message: 'Upstream rate limit reached.', retryAfterSeconds: 60 },
      { 'Retry-After': '60' },
    )
  }

  if (outcome.status !== 200) {
    safeLog('warn', 'password range http error', {
      provider: 'hibp',
      httpStatus: outcome.status,
      code: 'provider_error',
    })
    return apiError(502, { code: 'internal_error', message: 'Upstream error.' })
  }

  const suffixes: Record<string, number> = {}
  for (const line of outcome.body.split('\n')) {
    const match = line.trim().match(/^([0-9A-Fa-f]{35}):(\d+)$/)
    if (!match) continue
    const count = Number(match[2])
    if (count > 0) suffixes[match[1].toUpperCase()] = count
  }

  if (Object.keys(suffixes).length === 0) {
    return apiError(502, { code: 'internal_error', message: 'Unusable upstream payload.' })
  }

  const payload: PasswordRangeResponse = { prefix, suffixes }
  return json(payload, {
    // Non-identifying, non-personal: safe to cache briefly to reduce upstream load.
    headers: {
      'Cache-Control': `public, max-age=${PWNED_PASSWORDS.cacheSeconds}`,
    },
  })
}
