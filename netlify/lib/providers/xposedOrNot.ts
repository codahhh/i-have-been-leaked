/**
 * XposedOrNot provider.
 *
 * Primary email source. Documented endpoint:
 *   GET https://api.xposedornot.com/v1/check-email/{email}
 *
 * That endpoint returns breach *names* only, so when a match is found we make
 * one best-effort call to the public analytics endpoint to enrich the records
 * with dates, exposed data classes and descriptions. If the enrichment call
 * fails, the lookup still succeeds — it just shows less detail.
 */

import type { NormalizedBreach, ProviderResult } from '../../../src/types/index'
import { PROVIDERS, LIMITS, isProviderConfigured } from '../config'
import {
  asRecord,
  fetchWithTimeout,
  findObjectArray,
  parseRetryAfter,
  pickNumber,
  pickString,
  safeJsonParse,
  splitList,
  toStringList,
  uniqueStrings,
} from '../http'
import { toBreach, type BreachDraft } from '../normalize'

const DEFINITION = PROVIDERS.xposedornot

/** Pulls breach names out of every payload shape this endpoint is known to use. */
function extractBreachNames(payload: unknown): string[] {
  const record = asRecord(payload)
  if (!record) return []

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

  collect(record.breaches)
  // Some deployments nest the same list under a richer key.
  collect(record.ExposedBreaches)
  collect(asRecord(record.BreachesSummary)?.breaches)
  if (typeof record.BreachesSummary === 'object') {
    const summary = asRecord(record.BreachesSummary)
    const site = pickString(summary, ['site', 'sites', 'breaches'])
    if (site) names.push(...splitList(site))
  }

  return uniqueStrings(names.filter((name) => name.length <= 120))
}

/** Extracts detailed records from the analytics payload, tolerantly. */
function extractDetails(payload: unknown): BreachDraft[] {
  const arrays = findObjectArray(payload, [
    ['ExposedBreaches', 'breaches_details'],
    ['breaches_details'],
    ['ExposedBreaches'],
    ['BreachDetails'],
    ['breaches'],
  ])
  if (!arrays) return []

  return arrays.flatMap((entry) => {
    const name = pickString(entry, ['breach', 'name', 'title', 'BreachName'])
    if (!name) return []
    const exposed = toStringList(
      entry.searchableDataClasses ?? entry.dataClasses ?? entry.exposedData ?? null,
    )
    const exposedFromString = splitList(pickString(entry, ['xposed_data', 'exposed_data']))
    const breach: BreachDraft = {
      name,
      domain: pickString(entry, ['domain', 'website', 'site']),
      breachDate: pickString(entry, ['xposed_date', 'breachedDate', 'breach_date', 'date', 'AddedDate']),
      exposedData: uniqueStrings([...exposed, ...exposedFromString]),
      description: pickString(entry, ['details', 'description', 'summary']),
      pwnCount: pickNumber(entry, ['xposed_records', 'exposedRecords', 'pwnCount', 'records']),
    }
    return [breach]
  })
}

export async function queryXposedOrNot(
  email: string,
  deadline: number,
): Promise<ProviderResult> {
  const queriedAt = new Date().toISOString()

  if (!isProviderConfigured(DEFINITION)) {
    return {
      provider: 'xposedornot',
      displayName: DEFINITION.displayName,
      status: 'not_configured',
      responded: false,
      breaches: [],
      error: { code: 'not_configured', detail: DEFINITION.setupNote, retryAfterSeconds: null },
      queriedAt,
      durationMs: 0,
    }
  }

  const outcome = await fetchWithTimeout(DEFINITION.endpoints.checkEmail(email), {
    timeoutMs: DEFINITION.timeoutMs,
    deadline,
  })

  const base = {
    provider: 'xposedornot' as const,
    displayName: DEFINITION.displayName,
    queriedAt,
    breaches: [] as NormalizedBreach[],
  }

  if (outcome.kind === 'timeout') {
    return {
      ...base,
      status: 'timeout',
      responded: false,
      error: { code: 'timeout', detail: 'Provider did not answer before the deadline.', retryAfterSeconds: null },
      durationMs: outcome.durationMs,
    }
  }

  if (outcome.kind === 'network_error') {
    return {
      ...base,
      status: 'unavailable',
      responded: false,
      error: { code: 'network_error', detail: 'Could not reach the provider.', retryAfterSeconds: null },
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
    return {
      ...base,
      status: 'not_found',
      responded: true,
      error: null,
      durationMs: outcome.durationMs,
    }
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
  if (payload === null) {
    return {
      ...base,
      status: 'invalid_response',
      responded: false,
      error: { code: 'invalid_response', detail: 'Response was not valid JSON.', retryAfterSeconds: null },
      durationMs: outcome.durationMs,
    }
  }

  const names = extractBreachNames(payload)
  if (names.length === 0) {
    return {
      ...base,
      status: 'not_found',
      responded: true,
      error: null,
      durationMs: outcome.durationMs,
    }
  }

  // Enrichment is a bonus: it must never turn a success into a failure.
  const details = await enrich(names, email, deadline)
  const byName = new Map(details.map((draft) => [draft.name.toLowerCase(), draft]))

  const breaches = names.map((name) => {
    const detail = byName.get(name.toLowerCase())
    return toBreach(detail ?? { name }, 'xposedornot')
  })

  // Detailed records that the name list did not mention (defensive).
  const known = new Set(breaches.map((b) => b.name.toLowerCase()))
  for (const detail of details) {
    if (!known.has(detail.name.toLowerCase())) breaches.push(toBreach(detail, 'xposedornot'))
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

async function enrich(
  _names: string[],
  email: string,
  deadline: number,
): Promise<BreachDraft[]> {
  const enrichFn = DEFINITION.endpoints.enrichEmail
  if (!enrichFn) return []

  const budget = Math.min(DEFINITION.timeoutMs, LIMITS.enrichmentBudgetMs)
  const outcome = await fetchWithTimeout(enrichFn(email), {
    timeoutMs: budget,
    deadline: Math.min(deadline, Date.now() + budget),
  })
  if (outcome.kind !== 'response' || outcome.status !== 200) return []

  const payload = safeJsonParse(outcome.body)
  if (payload === null) return []
  return extractDetails(payload)
}
