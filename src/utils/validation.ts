/**
 * Pure validation helpers shared by the browser and the functions runtime.
 * No side effects, no dependencies — safe to import anywhere.
 */

export const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_PART_LENGTH = 64

/**
 * Pragmatic email validation.
 *
 * Deliberately *not* a full RFC 5322 implementation: the goal is to reject
 * typos and garbage before we send anything to a third party, while accepting
 * every address that real mail providers issue. The server re-validates with
 * the exact same function.
 */
export function isValidEmail(raw: string): boolean {
  const email = raw.trim()
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false
  if (/\s/.test(email)) return false
  if (email.includes('..')) return false

  const at = email.lastIndexOf('@')
  if (at <= 0 || at !== email.indexOf('@')) return false

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (local.length === 0 || local.length > MAX_LOCAL_PART_LENGTH) return false
  if (domain.length === 0 || domain.length > 253) return false

  const localPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/
  if (!localPattern.test(local)) return false
  if (local.startsWith('.') || local.endsWith('.')) return false

  // Domain: at least one dot, labels of 1-63 chars, no leading/trailing hyphen.
  const labels = domain.split('.')
  if (labels.length < 2) return false
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false
    if (!/^[A-Za-z0-9-]+$/.test(label)) return false
    if (label.startsWith('-') || label.endsWith('-')) return false
  }

  const tld = labels[labels.length - 1]
  return /^[A-Za-z]{2,}$/.test(tld)
}

/** Trim + lowercase for comparison purposes only (never persisted). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 64

export function isValidUsername(raw: string): boolean {
  const value = raw.trim()
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) return false
  return /^[A-Za-z0-9._-]+$/.test(value)
}

/** Accepts `ABCDE` — five hexadecimal characters, as required by HIBP ranges. */
export function isValidSha1Prefix(prefix: string): boolean {
  return /^[0-9A-Fa-f]{5}$/.test(prefix)
}

/** Basic sanity check for a 5-character base32 prefix (used by `/providers`). */
export function clampString(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}
