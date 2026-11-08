/**
 * Outbound call spacing.
 *
 * Both upstream APIs document strict per-second limits (XposedOrNot 2/s,
 * LeakCheck 1/s). The per-client limiter in `rateLimit.ts` protects us from a
 * single visitor; this protects the *provider* from the aggregate of every
 * visitor handled by one serverless instance, so we never get the deployment
 * blocked for abuse.
 *
 * It is best-effort by design: instances do not share memory, so a fleet of
 * cold lambda containers can still exceed the provider quota. When that
 * happens the provider answers 429, and the UI reports an incomplete lookup
 * rather than pretending the address is clean.
 */

const lastCallAt = new Map<string, number>()

/** Vitest sets this; serialising the test suite behind real timers is noise. */
function throttlingEnabled(): boolean {
  if (typeof process === 'undefined') return true
  return process.env?.VITEST !== 'true' && process.env?.IHL_DISABLE_THROTTLE !== '1'
}

export type SlotOutcome =
  | { ok: true; waitedMs: number }
  | { ok: false; retryAfterSeconds: number }

/**
 * Reserves the next allowed slot for `key`, waiting for it if necessary.
 *
 * Returns `ok: false` when the wait would not fit inside the caller's
 * deadline — the caller then reports a rate-limited provider instead of
 * blowing through the function's time budget.
 */
export async function reserveProviderSlot(
  key: string,
  minIntervalMs: number,
  deadline: number,
): Promise<SlotOutcome> {
  if (!throttlingEnabled() || minIntervalMs <= 0) return { ok: true, waitedMs: 0 }

  const now = Date.now()
  const earliest = (lastCallAt.get(key) ?? 0) + minIntervalMs
  const waitMs = Math.max(0, earliest - now)

  // Keep 750ms of headroom so the actual HTTP call still has room to answer.
  if (now + waitMs > deadline - 750) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) }
  }

  // Reserve before awaiting, so concurrent calls queue instead of racing.
  lastCallAt.set(key, now + waitMs)
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  return { ok: true, waitedMs: waitMs }
}

/** Test helper: forget every reservation. */
export function resetThrottle(): void {
  lastCallAt.clear()
}
