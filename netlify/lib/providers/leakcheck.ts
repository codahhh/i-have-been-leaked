/**
 * LeakCheck provider — public API (keyless, free, 1 request/s).
 *
 * Documented endpoint:
 *   GET https://leakcheck.io/api/public?check={email or username}
 *   GET https://leakcheck.io/api/public?check={E164 digits}&type=phone
 *
 * Verified response shapes:
 *
 *   match:    {"success":true,"found":1675,
 *              "fields":["city","password","ssn","dob",…],
 *              "sources":[{"name":"Aura.com","date":"2026-03"},…]}
 *   no match: {"success":false,"error":"Not found"}
 *   bad type: {"success":false,"error":"Could not determine search type automatically"}
 *
 * Phone search is part of the free public tier, but only if the number is sent
 * as bare E.164 digits plus `type=phone`. Verified 2026-11-08:
 *   ?check=33612345678&type=phone → {"success":true,"found":50,"sources":[…]}
 *   ?check=+33612345678          → {"success":false,"error":"Could not determine …"}
 *   ?check=33759812345&type=phone → {"success":false,"error":"Not found"}
 *
 * The public tier deliberately never returns the leaked values themselves —
 * only the breach sources and the *categories* of exposed data. Those
 * categories are reported once, for the whole query, so they are attached to
 * the provider result (`exposedCategories`) and never copied onto individual
 * breach records, which would attribute aggregate data to a single source.
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

const DEFINITION = PROVIDERS.leakcheck

/** Sources are paginated in spirit only: the public tier caps the list. */
const MAX_SOURCES = 400

/** `sources[].name` → a breach draft; the date is the source's own date. */
function extractSources(record: Record<string, unknown>): BreachDraft[] {
  const entries = record.sources
  if (!Array.isArray(entries)) return []

  const drafts: BreachDraft[] = []
  for (const entry of entries.slice(0, MAX_SOURCES)) {
    const source = asRecord(entry)
    if (!source) continue
    const name = pickString(source, ['name', 'breach', 'title'])
    if (!name) continue
    drafts.push({
      name,
      // Source names are usually domains ("Aura.com") but not always
      // ("CDEK", "Regme"); `cleanDomain` keeps only the real ones.
      domain: pickString(source, ['domain', 'name']),
      breachDate: pickString(source, ['date', 'breach_date', 'breachDate']),
    })
  }
  return drafts
}

/** Aggregate categories → the raw vocabulary the UI already classifies. */
function extractCategories(record: Record<string, unknown>): string[] {
  return uniqueStrings(toStringList(record.fields ?? record.types ?? null)).slice(0, 24)
}

export async function queryLeakCheck(
  value: string,
  kind: 'email' | 'username' | 'phone',
  deadline: number,
): Promise<ProviderResult> {
  const queriedAt = new Date().toISOString()

  const base = {
    provider: 'leakcheck' as const,
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

  const url =
    kind === 'email'
      ? DEFINITION.endpoints.checkEmail?.(value)
      : kind === 'username'
        ? DEFINITION.endpoints.checkUsername?.(value)
        : DEFINITION.endpoints.checkPhone?.(value)
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

  const success = record.success
  if (success === false) {
    const message = pickString(record, ['error', 'message']) ?? ''
    // An explicit "nothing for this identifier" is a real, trustworthy answer.
    if (/not\s*found/i.test(message)) {
      return { ...base, status: 'not_found', responded: true, error: null, durationMs: outcome.durationMs }
    }
    // Anything else ("Could not determine search type automatically", an
    // upstream failure, …) stays a failure: it must never read as clean.
    return {
      ...base,
      status: 'unavailable',
      responded: false,
      error: {
        code: 'provider_error',
        detail: message ? `Provider reported: ${message.slice(0, 120)}` : 'Provider refused the query.',
        retryAfterSeconds: null,
      },
      durationMs: outcome.durationMs,
    }
  }

  // Neither an explicit success, nor a source list, nor a match count: this is
  // not a payload we can read, and reading it as "nothing found" would be a
  // false negative. Refuse it instead.
  if (
    success !== true &&
    !Array.isArray(record.sources) &&
    typeof record.found !== 'number'
  ) {
    return {
      ...base,
      status: 'invalid_response',
      responded: false,
      error: {
        code: 'invalid_response',
        detail: 'Response did not match any known schema.',
        retryAfterSeconds: null,
      },
      durationMs: outcome.durationMs,
    }
  }

  const drafts = extractSources(record)
  const categories = extractCategories(record)
  const found = pickNumber(record, ['found', 'count'])

  if (drafts.length === 0) {
    // `found > 0` with no usable sources means we cannot name what leaked.
    // Saying "no match" here would be a false negative, so it is a failure.
    if (found !== null && found > 0) {
      return {
        ...base,
        status: 'invalid_response',
        responded: false,
        error: {
          code: 'invalid_response',
          detail: 'Provider reported matches without naming a source.',
          retryAfterSeconds: null,
        },
        durationMs: outcome.durationMs,
      }
    }
    return {
      ...base,
      status: 'not_found',
      responded: true,
      exposedCategories: categories,
      error: null,
      durationMs: outcome.durationMs,
    }
  }

  return {
    ...base,
    status: 'ok',
    responded: true,
    breaches: drafts.map((draft) => toBreach(draft, 'leakcheck')),
    exposedCategories: categories,
    error: null,
    durationMs: outcome.durationMs,
  }
}
