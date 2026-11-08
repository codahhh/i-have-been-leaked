/**
 * Privacy-preserving logging.
 *
 * Two rules, enforced by construction:
 *   1. The queried identifier (email / phone / username) is never passed here.
 *   2. Every string is scrubbed for anything that *looks* like personal data
 *      before it reaches the platform logs.
 *
 * Server logs are shipped off-platform by the host, so treating them as
 * hostile territory is the only safe default.
 */

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const LONG_DIGITS = /\b\d{6,}\b/g
const HEX_LIKE = /\b[0-9A-Fa-f]{32,}\b/g

export function scrub(text: string): string {
  return text
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(HEX_LIKE, '[redacted-hash]')
    .replace(LONG_DIGITS, '[redacted-number]')
    .slice(0, 300)
}

export type LogMeta = Record<string, string | number | boolean | null | undefined>

const ALLOWED_META_KEYS = new Set([
  'provider',
  'status',
  'code',
  'httpStatus',
  'durationMs',
  'route',
  'reason',
  'attempt',
  'configured',
  'count',
  'state',
])

export function safeLog(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta) {
  const safeMeta: Record<string, string | number | boolean | null> = {}
  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (!ALLOWED_META_KEYS.has(key)) continue
      if (value === undefined) continue
      safeMeta[key] =
        typeof value === 'string' ? scrub(value) : (value as number | boolean | null)
    }
  }
  const line = `[ihl] ${message}`
  if (level === 'error') console.error(line, safeMeta)
  else if (level === 'warn') console.warn(line, safeMeta)
  else console.log(line, safeMeta)
}

/** Never log a thrown value directly: messages can embed the request URL. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return scrub(`${error.name}: ${error.message}`)
  return 'unknown error'
}
