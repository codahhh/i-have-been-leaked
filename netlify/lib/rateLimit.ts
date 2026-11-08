/**
 * Basic abuse protection.
 *
 * A fixed-window counter keyed by a salted hash of the client IP. The raw IP
 * is never stored, and the salt rotates with the function instance so the
 * keys cannot be reversed or correlated across instances.
 *
 * This is intentionally dependency-free. It protects a single function
 * instance; for fleet-wide protection put Netlify's rate limiting, a WAF rule
 * or a shared counter (Netlify Blobs / Upstash) in front. Documented in the
 * README.
 */

import { createHash, randomBytes } from 'node:crypto'

const INSTANCE_SALT = randomBytes(16).toString('hex')

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()
const MAX_BUCKETS = 5000

export interface RateLimitConfig {
  limit: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-nf-client-connection-ip')
    ?? request.headers.get('x-forwarded-for')
    ?? ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  return createHash('sha256').update(`${INSTANCE_SALT}:${ip}`).digest('hex').slice(0, 24)
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  if (buckets.size > MAX_BUCKETS) sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.limit - 1, retryAfterSeconds: 0 }
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    retryAfterSeconds: 0,
  }
}

function sweep(now: number) {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key)
  }
  // Still too many live buckets: drop the oldest half.
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS
    let removed = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++removed >= excess) break
    }
  }
}

/** Test helper — never called from production code paths. */
export function resetRateLimits() {
  buckets.clear()
}
