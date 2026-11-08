import type { BreachStats, ProvidersResponse } from '@/types'
import { RequestError, getJson } from './api'

/**
 * Provider capability matrix.
 *
 * Fetched from the server (single source of truth) and memoised in module
 * scope for the session. This contains no personal data, so caching is safe.
 */
let providersPromise: Promise<ProvidersResponse> | null = null

/**
 * A 200 response is not proof of a valid payload: a proxy, a stale deploy or a
 * truncated body can all slip through. Anything unexpected is treated as an
 * error so the UI degrades instead of crashing on `undefined.filter`.
 */
function parseProviders(payload: unknown): ProvidersResponse {
  const candidate = payload as ProvidersResponse | null
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    !Array.isArray(candidate.providers) ||
    !candidate.providers.every(
      (provider) =>
        typeof provider?.id === 'string' && typeof provider?.displayName === 'string',
    )
  ) {
    throw new RequestError('invalid_response', 200)
  }
  return {
    ...candidate,
    emailProviders: Array.isArray(candidate.emailProviders) ? candidate.emailProviders : [],
    usernameProviders: Array.isArray(candidate.usernameProviders)
      ? candidate.usernameProviders
      : [],
    phoneProviders: Array.isArray(candidate.phoneProviders) ? candidate.phoneProviders : [],
  }
}

export function loadProviders(): Promise<ProvidersResponse> {
  if (!providersPromise) {
    providersPromise = getJson<unknown>('/api/providers', 8000)
      .then(parseProviders)
      .catch((error) => {
        // Allow a retry on the next call instead of caching the failure.
        providersPromise = null
        throw error
      })
  }
  return providersPromise
}

function parseStats(payload: unknown): BreachStats {
  const candidate = payload as BreachStats | null
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    typeof candidate.available !== 'boolean' ||
    typeof candidate.totalBreaches !== 'number'
  ) {
    // The panel hides itself on failure — never invents figures.
    throw new RequestError('invalid_response', 200)
  }
  return candidate
}

/** Aggregate public figures. Never cached client-side beyond the request. */
export function loadBreachStats(): Promise<BreachStats> {
  return getJson<unknown>('/api/breach-stats', 10_000).then(parseStats)
}
