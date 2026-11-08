/**
 * XposedOrNot provider.
 *
 * Documented endpoint (keyless, free tier):
 *   GET https://api.xposedornot.com/v1/check-email/{email}?details=true
 *
 * Verified response shapes:
 *
 *   match:     {"breaches":[["Adobe","LinkedIn"]],"email":"…","status":"success",
 *               "breach_details":[{"name":"Adobe","records_exposed":152445165,
 *               "description":"…","breach_date":"2013-10-04",
 *               "company":{"name":"adobe.com"},"exposed_data":["Email addresses",…]}]}
 *   no match:  {"Error":"Not found","email":null}
 *
 * `details=true` returns the metadata in the same call as the name list, so a
 * lookup costs exactly one request against the provider's quota.
 */

import type { NormalizedBreach, ProviderResult } from '../../../src/types/index'
import { PROVIDERS, isProviderConfigured } from '../config'
import {
  asRecord,
  fetchWithTimeout,
  parseRetryAfter,
  pickNumber,
  pickString,
  safeJsonParse,
  toStringList,
  uniqueStrings,
} from '../http'
import { toBreach, type BreachDraft } from '../normalize'
import { reserveProviderSlot } from '../throttle'

const DEFINITION = PROVIDERS.xposedornot

/** Hard cap on parsed detail records — bounds the work for huge payloads. */
const MAX_DETAILS = 400

/**
 * Breach names live in `breaches`, which is `[["A","B"]]` in practice but is
 * typed loosely here because the payload is third-party.
 */
function extractBreachNames(payload: Record<string, unknown>): string[] {
  const names: string[] = []

  const collect = (entries: unknown) => {
    if (!Array.isArray(entries)) return
    for (const entry of entries) {
      if (typeof entry === 'string') {
        names.push(entry)
      } else if (Array.isArray(entry)) {
        for (const item of entry) if (typeof item === 'string') names.push(item)
      } else {
        const object = asRecord(entry)
        const name = pickString(object, ['breach', 'name', 'title', 'BreachName'])
        if (name) names.push(name)
      }
    }
  }

  collect(payload.breaches)
  collect(payload.ExposedBreaches)

  return uniqueStrings(
    names.map((name) => name.trim()).filter((name) => name.length > 0 && name.length <= 120),
  )
}

/** `breach_details` entries → normalised drafts. */
function extractDetails(payload: Record<string, unknown>): BreachDraft[] {
  const entries = payload.breach_details
  if (!Array.isArray(entries)) return []

  const drafts: BreachDraft[] = []
  for (const entry of entries.slice(0, MAX_DETAILS)) {
    const record = asRecord(entry)
    if (!record) continue
    const name = pickString(record, ['name', 'breach', 'title'])
    if (!name) continue

    const company = asRecord(record.company)
    const security = asRecord(record.security)

    drafts.push({
      name,
      domain: pickString(company, ['name', 'domain']) ?? pickString(record, ['domain', 'website']),
      breachDate: pickString(record, ['breach_date', 'breachDate', 'xposed_date', 'date']),
      exposedData: toStringList(record.exposed_data ?? record.exposedData ?? null),
      description: pickString(record, ['description', 'details', 'summary']),
      pwnCount: pickNumber(record, ['records_exposed', 'pwnCount', 'exposedRecords']),
    })

    // `security.password_risk` ("easytocrack", "hardtocrack", …) is a real,
    // useful signal; it is folded into the exposed categories so it reaches the
    // UI without adding a provider-specific field to the shared model.
    const risk = pickString(security, ['password_risk'])
    const draft = drafts[drafts.length - 1]
    if (risk && risk !== 'unknown' && draft) {
      draft.exposedData = uniqueStrings([...(draft.exposedData ?? []), `Password risk: ${risk}`])
    }
  }
  return drafts
}

/** An explicit "we have no record of this address" body from the provider. */
function isExplicitNotFound(payload: unknown): boolean {
  const record = asRecord(payload)
  if (!record) return false
  const error = pickString(record, ['Error', 'error', 'message'])
  return error !== null && /not\s*found/i.test(error)
}

export async function queryXposedOrNot(
  email: string,
  deadline: number,
): Promise<ProviderResult> {
  const queriedAt = new Date().toISOString()

  const base = {
    provider: 'xposedornot' as const,
    displayName: DEFINITION.displayName,
    queriedAt,
    breaches: [] as NormalizedBreach[],
    exposedCategories: [] as string[],
  }

  if (!isProviderConfigured(DEFINITION)) {
    return {
      ...base,
      status: 'not_configured',
      responded: false,
      error: { code: 'not_configured', detail: DEFINITION.setupNote, retryAfterSeconds: null },
      durationMs: 0,
    }
  }

  const slot = await reserveProviderSlot(DEFINITION.id, DEFINITION.minIntervalMs, deadline)
  if (!slot.ok) {
    return {
      ...base,
      status: 'rate_limited',
      responded: false,
      error: {
        code: 'rate_limited',
        detail: 'Outbound calls to this provider are currently spaced out.',
        retryAfterSeconds: slot.retryAfterSeconds,
      },
      durationMs: 0,
    }
  }

  const url = DEFINITION.endpoints.checkEmail?.(email)
  if (!url) {
    return {
      ...base,
      status: 'not_configured',
      responded: false,
      error: { code: 'not_configured', detail: 'No endpoint configured.', retryAfterSeconds: null },
      durationMs: 0,
    }
  }

  const outcome = await fetchWithTimeout(url, {
    timeoutMs: DEFINITION.timeoutMs,
    deadline,
  })

  if (outcome.kind === 'timeout') {
    return {
      ...base,
      status: 'timeout',
      responded: false,
      error: {
        code: 'timeout',
        detail: 'Provider did not answer before the deadline.',
        retryAfterSeconds: null,
      },
      durationMs: outcome.durationMs,
    }
  }

  if (outcome.kind === 'network_error') {
    return {
      ...base,
      status: 'unavailable',
      responded: false,
      error: {
        code: 'network_error',
        detail: 'Could not reach the provider.',
        retryAfterSeconds: null,
      },
      durationMs: outcome.durationMs,
    }
  }

  if (outcome.status === 429) {
    return {
      ...base,
      status: 'rate_limited',
      responded: false,
      error: {
        code: 'rate_limited',
        detail: 'Provider rate limit reached.',
        retryAfterSeconds: parseRetryAfter(outcome.headers),
      },
      durationMs: outcome.durationMs,
    }
  }

  // A documented 404 is a real answer: the index has no record for this address.
  if (outcome.status === 404 || outcome.status === 204) {
    return { ...base, status: 'not_found', responded: true, error: null, durationMs: outcome.durationMs }
  }

  if (outcome.status < 200 || outcome.status >= 300) {
    return {
      ...base,
      status: 'unavailable',
      responded: false,
      error: {
        code: 'provider_error',
        detail: `Provider returned HTTP ${outcome.status}.`,
        retryAfterSeconds: parseRetryAfter(outcome.headers),
      },
      durationMs: outcome.durationMs,
    }
  }

  const payload = safeJsonParse(outcome.body)
  const record = asRecord(payload)
  if (!record) {
    return {
      ...base,
      status: 'invalid_response',
      responded: false,
      error: { code: 'invalid_response', detail: 'Response was not valid JSON.', retryAfterSeconds: null },
      durationMs: outcome.durationMs,
    }
  }

  if (isExplicitNotFound(payload)) {
    return { ...base, status: 'not_found', responded: true, error: null, durationMs: outcome.durationMs }
  }

  const names = extractBreachNames(record)
  const details = extractDetails(record)

  if (names.length === 0 && details.length === 0) {
    // An error body that is *not* "not found" must never be read as a clean
    // answer — that is exactly the failure mode this project exists to avoid.
    const error = pickString(record, ['Error', 'error', 'message'])
    if (error) {
      return {
        ...base,
        status: 'unavailable',
        responded: false,
        error: {
          code: 'provider_error',
          detail: `Provider reported: ${error.slice(0, 120)}`,
          retryAfterSeconds: null,
        },
        durationMs: outcome.durationMs,
      }
    }
    // A well-formed success body with an empty breach list is a real "not found".
    return { ...base, status: 'not_found', responded: true, error: null, durationMs: outcome.durationMs }
  }

  const byName = new Map(details.map((draft) => [draft.name.toLowerCase(), draft]))
  const breaches: NormalizedBreach[] = names.map((name) =>
    toBreach(byName.get(name.toLowerCase()) ?? { name }, 'xposedornot'),
  )

  // Detail records the name list did not mention (defensive).
  const known = new Set(breaches.map((breach) => breach.name.toLowerCase()))
  for (const detail of details) {
    if (!known.has(detail.name.toLowerCase())) {
      breaches.push(toBreach(detail, 'xposedornot'))
      known.add(detail.name.toLowerCase())
    }
  }

  return {
    ...base,
    status: 'ok',
    responded: true,
    breaches,
    error: null,
    durationMs: outcome.durationMs,
  }
}
