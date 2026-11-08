/**
 * POST /api/check-email
 * Body: { email: string, consent: boolean }
 *
 * Orchestrates the provider queries, merges the results and derives an honest
 * verdict. Three invariants:
 *
 *   1. No provider failure is ever reported as a clean result.
 *   2. The submitted address is never logged, cached or echoed into errors.
 *   3. Every provider outcome is reported individually to the client.
 */

import type {
  EmailCheckResponse,
  LookupState,
  ProviderResult,
} from '../../../src/types/index'
import { isValidEmail, normalizeEmail } from '../../../src/utils/validation'
import { EMAIL_PROVIDER_IDS, LIMITS, PROVIDERS, RATE_LIMITS } from '../config'
import { safeLog } from '../log'
import { mergeBreaches } from '../merge'
import { queryOrelys } from '../providers/orelys'
import { queryXposedOrNot } from '../providers/xposedOrNot'
import { checkRateLimit, clientKey } from '../rateLimit'
import {
  apiError,
  isAllowedOrigin,
  json,
  methodNotAllowed,
  readJsonBody,
} from '../responses'

const PROVIDER_QUERIES = {
  xposedornot: queryXposedOrNot,
  orelys: queryOrelys,
} as const

async function runProvider(
  id: (typeof EMAIL_PROVIDER_IDS)[number],
  email: string,
  deadline: number,
): Promise<ProviderResult> {
  try {
    return await PROVIDER_QUERIES[id](email, deadline)
  } catch (error) {
    // Defensive: a provider adapter must never take the whole lookup down.
    safeLog('error', 'provider adapter threw', {
      provider: id,
      code: error instanceof Error ? error.name : 'unknown',
    })
    return {
      provider: id,
      displayName: PROVIDERS[id].displayName,
      status: 'unavailable',
      responded: false,
      breaches: [],
      error: { code: 'unknown', detail: 'Provider adapter failed.', retryAfterSeconds: null },
      queriedAt: new Date().toISOString(),
      durationMs: 0,
    }
  }
}

export function deriveState(
  breachCount: number,
  providers: ProviderResult[],
  totalProviders: number,
): LookupState {
  if (breachCount > 0) return 'breached'
  const responded = providers.filter((provider) => provider.responded).length
  if (responded === 0) return 'error'
  if (responded < totalProviders) return 'incomplete'
  return 'clean'
}

export async function handleCheckEmail(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  if (!isAllowedOrigin(request)) {
    return apiError(403, { code: 'invalid_request', message: 'Origin not allowed.' })
  }

  const limit = checkRateLimit(clientKey(request), RATE_LIMITS.checkEmail)
  if (!limit.allowed) {
    safeLog('warn', 'rate limited', { route: 'check-email' })
    return apiError(
      429,
      {
        code: 'rate_limited',
        message: 'Too many lookups. Please wait before trying again.',
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      { 'Retry-After': String(limit.retryAfterSeconds) },
    )
  }

  const body = await readJsonBody(request)
  if (!body.ok) return body.response

  const rawEmail = body.value.email
  const consent = body.value.consent

  if (typeof rawEmail !== 'string' || !isValidEmail(rawEmail)) {
    return apiError(400, { code: 'invalid_email', message: 'The address is not valid.' })
  }

  // Explicit, versioned consent is required before anything leaves our server.
  if (consent !== true) {
    return apiError(400, {
      code: 'consent_required',
      message: 'Consent to query the external providers is required.',
    })
  }

  const email = normalizeEmail(rawEmail)
  const startedAt = Date.now()
  const deadline = startedAt + LIMITS.lookupDeadlineMs

  const providers = await Promise.all(
    EMAIL_PROVIDER_IDS.map((id) => runProvider(id, email, deadline)),
  )

  const breaches = mergeBreaches(providers)
  const totalProviders = EMAIL_PROVIDER_IDS.length
  const respondingProviders = providers.filter((provider) => provider.responded).length
  const state = deriveState(breaches.length, providers, totalProviders)

  const response: EmailCheckResponse = {
    ok: state !== 'error',
    state,
    checkedAt: new Date().toISOString(),
    totalBreaches: breaches.length,
    breaches,
    providers,
    respondingProviders,
    totalProviders,
    durationMs: Date.now() - startedAt,
  }

  safeLog('info', 'email lookup completed', {
    state,
    count: breaches.length,
    durationMs: response.durationMs,
  })

  return json(response)
}
