/**
 * GET /api/breach-stats
 *
 * Aggregate figures taken from the public XposedOrNot breach index. This is
 * the only place where "numbers" appear in the UI, and they are computed from
 * a real source at request time — never hardcoded. If the source is
 * unreachable the endpoint says so and the homepage hides the section.
 */

import type { BreachStats } from '../../../src/types/index'
import { PROVIDERS, RATE_LIMITS, STATS } from '../config'
import { asRecord, fetchWithTimeout, pickNumber, pickString, safeJsonParse } from '../http'
import { safeLog } from '../log'
import { checkRateLimit, clientKey } from '../rateLimit'
import { apiError, json, methodNotAllowed } from '../responses'

function buildUnavailable(): BreachStats {
  return {
    available: false,
    source: STATS.source,
    sourceUrl: STATS.sourceUrl,
    totalBreaches: 0,
    totalRecords: null,
    latestBreach: null,
    fetchedAt: new Date().toISOString(),
  }
}

export async function handleBreachStats(request: Request): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed('GET')

  const limit = checkRateLimit(`stats:${clientKey(request)}`, RATE_LIMITS.breachStats)
  if (!limit.allowed) {
    return apiError(429, {
      code: 'rate_limited',
      message: 'Too many requests.',
      retryAfterSeconds: limit.retryAfterSeconds,
    })
  }

  const endpoint = PROVIDERS.xposedornot.endpoints.breachIndex
  if (!endpoint) return json(buildUnavailable())

  const outcome = await fetchWithTimeout(endpoint, { timeoutMs: STATS.timeoutMs })

  if (outcome.kind !== 'response' || outcome.status !== 200) {
    safeLog('warn', 'breach stats unavailable', {
      provider: 'xposedornot',
      code: outcome.kind === 'response' ? `http_${outcome.status}` : outcome.kind,
    })
    return json(buildUnavailable())
  }

  const payload = safeJsonParse(outcome.body)
  const record = asRecord(payload)
  const entries = Array.isArray(record?.exposedBreaches)
    ? record.exposedBreaches
    : Array.isArray(record?.breaches)
      ? record.breaches
      : null

  if (!entries) {
    safeLog('warn', 'breach stats unexpected payload', { provider: 'xposedornot' })
    return json(buildUnavailable())
  }

  let totalRecords = 0
  let recordsKnown = false
  let latest: BreachStats['latestBreach'] = null
  let latestDate = ''

  for (const raw of entries) {
    const entry = asRecord(raw)
    if (!entry) continue
    const records = pickNumber(entry, ['exposedRecords', 'xposed_records', 'records', 'pwnCount'])
    if (typeof records === 'number' && records > 0) {
      totalRecords += records
      recordsKnown = true
    }
    const date = pickString(entry, ['breachedDate', 'xposedDate', 'breachDate', 'date'])
    const name = pickString(entry, ['breachID', 'breach', 'name', 'title'])
    if (date && name && date > latestDate) {
      latestDate = date
      latest = { name, date }
    }
  }

  const stats: BreachStats = {
    available: entries.length > 0,
    source: STATS.source,
    sourceUrl: STATS.sourceUrl,
    totalBreaches: entries.length,
    totalRecords: recordsKnown ? totalRecords : null,
    latestBreach: latest,
    fetchedAt: new Date().toISOString(),
  }

  return json(stats, {
    headers: { 'Cache-Control': `public, max-age=${STATS.cacheSeconds}` },
  })
}
