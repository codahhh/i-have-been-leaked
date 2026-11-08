/**
 * Pwned Passwords, k-anonymity protocol.
 *
 * The password is hashed with SHA-1 *in this browser tab*. Only the first five
 * characters of the digest ever leave the page. The full digest is compared
 * locally against the returned range.
 *
 * Hard rules enforced here:
 *   · the password is never stored in a module-level variable, state or storage
 *   · the full hash is never returned, logged or put in a URL
 *   · the only network payload derived from a password is a 5-char prefix
 */

import type { PasswordRangeResponse } from '@/types'
import { RequestError, getJson } from './api'

const RANGE_ENDPOINT = 'https://api.pwnedpasswords.com/range/'
const HIBP_TIMEOUT_MS = 8000
const RELAY_TIMEOUT_MS = 9000

export type PasswordSource = 'direct' | 'relay'

export interface PasswordCheckResult {
  breached: boolean
  /** Number of times this exact password appears in the corpus. */
  count: number
  /** Number of distinct digests in the returned range (context for "not found"). */
  rangeSize: number
  /** Which path answered — shown to the user for transparency. */
  source: PasswordSource
}

export type PasswordCheckFailure =
  | 'hash_unavailable'
  | 'insecure_context'
  | 'network_error'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_response'

export class PasswordCheckError extends Error {
  readonly reason: PasswordCheckFailure
  readonly retryAfterSeconds: number | null

  constructor(reason: PasswordCheckFailure, retryAfterSeconds: number | null = null) {
    super(reason)
    this.name = 'PasswordCheckError'
    this.reason = reason
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/** Web Crypto is only exposed in a secure context (https://, localhost). */
export function isHashingAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle?.digest === 'function'
  )
}

/** Uppercase hex SHA-1 digest of the UTF-8 bytes of `text`. */
export async function sha1Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  const view = new Uint8Array(digest)

  let hex = ''
  for (const byte of view) hex += byte.toString(16).padStart(2, '0')
  return hex.toUpperCase()
}

function parseRange(body: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    const separator = trimmed.indexOf(':')
    if (separator !== 35) continue
    const suffix = trimmed.slice(0, 35).toUpperCase()
    const count = Number(trimmed.slice(separator + 1))
    if (!/^[0-9A-F]{35}$/.test(suffix) || !Number.isFinite(count)) continue
    map.set(suffix, count)
  }
  return map
}

async function fetchDirectRange(prefix: string): Promise<Map<string, number>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS)
  try {
    const response = await fetch(`${RANGE_ENDPOINT}${prefix}?add-padding=true`, {
      // Padding rows (count 0) make the response size independent of the
      // number of matches, so the request leaks nothing through its size.
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (response.status === 429) throw new PasswordCheckError('rate_limited')
    if (!response.ok) throw new PasswordCheckError('network_error')
    const map = parseRange(await response.text())
    if (map.size === 0) throw new PasswordCheckError('invalid_response')
    return map
  } catch (error) {
    if (error instanceof PasswordCheckError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PasswordCheckError('timeout')
    }
    throw new PasswordCheckError('network_error')
  } finally {
    clearTimeout(timer)
  }
}

async function fetchRelayRange(prefix: string): Promise<Map<string, number>> {
  try {
    const data = await getJson<PasswordRangeResponse>(
      `/api/password-range?prefix=${prefix}`,
      RELAY_TIMEOUT_MS,
    )
    const map = new Map<string, number>()
    for (const [suffix, count] of Object.entries(data.suffixes ?? {})) {
      map.set(suffix.toUpperCase(), Number(count))
    }
    if (map.size === 0) throw new PasswordCheckError('invalid_response')
    return map
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.code === 'rate_limited') throw new PasswordCheckError('rate_limited')
      if (error.code === 'timeout') throw new PasswordCheckError('timeout')
      if (error.code === 'invalid_response') throw new PasswordCheckError('invalid_response')
    }
    throw new PasswordCheckError('network_error')
  }
}

/**
 * Checks a password against the Pwned Passwords corpus.
 *
 * Tries the direct range API first (no third party learns your IP but HIBP);
 * falls back to our relay when the network blocks the direct call.
 */
export async function checkPassword(password: string): Promise<PasswordCheckResult> {
  if (!isHashingAvailable()) {
    throw new PasswordCheckError(
      window.isSecureContext === false ? 'insecure_context' : 'hash_unavailable',
    )
  }

  if (password.length === 0) throw new PasswordCheckError('invalid_response')

  let digest: string
  try {
    digest = await sha1Hex(password)
  } catch {
    throw new PasswordCheckError('hash_unavailable')
  }

  const prefix = digest.slice(0, 5)
  const suffix = digest.slice(5)

  let source: PasswordSource = 'direct'
  let range: Map<string, number>
  try {
    range = await fetchDirectRange(prefix)
  } catch (directError) {
    try {
      range = await fetchRelayRange(prefix)
      source = 'relay'
    } catch {
      // Surface the more informative of the two failures.
      if (directError instanceof PasswordCheckError) throw directError
      throw new PasswordCheckError('network_error')
    }
  }

  const count = range.get(suffix) ?? 0
  return { breached: count > 0, count, rangeSize: range.size, source }
}
