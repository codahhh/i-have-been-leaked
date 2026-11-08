/**
 * Orelys provider.
 *
 * Documented endpoint:
 *   POST https://api.orelys.io/v1/breaches/check
 *   { "email": "user@example.com" }
 *
 * Credentials are required and are read from the environment only. When the
 * key is absent the provider is reported as `not_configured` — the lookup is
 * then marked *incomplete*, never clean.
 *
 * The response parser is deliberately tolerant about envelope names because
 * the API documentation we have access to does not pin a single schema.
 */

import type { NormalizedBreach, ProviderResult } from '../../../src/types/index'
import { PROVIDERS, isProviderConfigured, readEnv } from '../config'
import {
  asRecord,
  fetchWithTimeout,
  findObjectArray,
  parseRetryAfter,
  pickNumber,
  pickString,
  safeJsonParse,
  toStringList,
} from '../http'
import { toBreach, type BreachDraft } from '../normalize'

const DEFINITION = PROVIDERS.orelys

function buildAuthHeaders(key: string): Record<string, string> {
  const headerName = readEnv('ORELYS_API_KEY_HEADER')?.trim() || 'Authorization'
  const prefix = readEnv('ORELYS_API_KEY_PREFIX')
  if (prefix !== undefined) return { [headerName]: prefix ? `${prefix} ${key}` : key }
  return headerName.toLowerCase() === 'authorization'
    ? { [headerName]: `Bearer ${key}` }
    : { [headerName]: key }
}

function extractBreaches(payload: unknown): BreachDraft[] | null {
  const record = asRecord(payload)
  if (record) {
    // Explicit negative answers are answers.
    if (record.found === false || record.exists === false || record.pwned === false) return []

    const arrays = findObjectArray(payload, [
      ['breaches'],
      ['data', 'breaches'],
      ['result', 'breaches'],
      ['results'],
      ['data'],
      ['matches'],
    ])
    if (arrays === null) return null

    return arrays.flatMap((entry) => {
      const name = pickString(entry, ['name', 'breach', 'title', 'breachName', 'source'])
      if (!name) return []
      const draft: BreachDraft = {
        name,
        domain: pickString(entry, ['domain', 'website', 'url']),
        breachDate: pickString(entry, [
          'breachDate',
          'breachedAt',
          'breach_date',
          'date',
          'discoveredAt',
        ]),
        exposedData: toStringList(
          entry.dataClasses ?? entry.exposedData ?? entry.data ?? entry.exposed_data ?? null,
        ),
        description: pickString(entry, ['description', 'summary', 'details']),
        pwnCount: pickNumber(entry, ['pwnCount', 'records', 'exposedRecords', 'affectedAccounts']),
      }
      return [draft]
    })
  }
  return null
}

export async function queryOrelys(email: string, deadline: number): Promise<ProviderResult> {
  const queriedAt = new Date().toISOString()
  const base = {
    provider: 'orelys' as const,
    displayName: DEFINITION.displayName,
    queriedAt,
    breaches: [] as NormalizedBreach[],
  }

  const apiKey = readEnv('ORELYS_API_KEY')
  if (!isProviderConfigured(DEFINITION) || !apiKey) {
    return {
      ...base,
      status: 'not_configured',
      responded: false,
      error: {
        code: 'not_configured',
        detail: 'ORELYS_API_KEY is not set on this deployment.',
        retryAfterSeconds: null,
      },
      durationMs: 0,
    }
  }

  const outcome = await fetchWithTimeout(DEFINITION.endpoints.checkEmail(email), {
    method: 'POST',
    headers: buildAuthHeaders(apiKey),
    body: JSON.stringify({ email }),
    timeoutMs: DEFINITION.timeoutMs,
    deadline,
  })

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

  if (outcome.status === 401 || outcome.status === 403) {
    return {
      ...base,
      status: 'not_configured',
      responded: false,
      error: {
        code: 'unauthorized',
        detail: 'Provider rejected the configured credentials.',
        retryAfterSeconds: null,
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
  const drafts = payload === null ? null : extractBreaches(payload)

  if (drafts === null) {
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

  return {
    ...base,
    status: drafts.length === 0 ? 'not_found' : 'ok',
    responded: true,
    breaches: drafts.map((draft) => toBreach(draft, 'orelys')),
    error: null,
    durationMs: outcome.durationMs,
  }
}
