/**
 * POST /api/check-email   — Body: { email: string, consent: boolean }
 * POST /api/check-username — Body: { username: string, consent: boolean }
 *
 * One orchestrator for every identifier we can really check: it runs the
 * relevant provider adapters in parallel, merges their records and derives an
 * honest verdict. Three invariants hold for both routes:
 *
 *   1. No provider failure is ever reported as a clean result.
 *   2. The submitted identifier is never logged, cached or echoed into errors.
 *   3. Every provider outcome is reported individually to the client.
 */

import type {
  CheckResponse,
  LookupKind,
  LookupState,
  ProviderId,
  ProviderResult,
} from '../../../src/types/index'
import {
  isValidEmail,
  isValidUsername,
  normalizeEmail,
} from '../../../src/utils/validation'
import { EMAIL_PROVIDER_IDS, LIMITS, PROVIDERS, RATE_LIMITS, USERNAME_PROVIDER_IDS } from '../config'
import { safeLog } from '../log'
import { mergeBreaches } from '../merge'
import { queryLeakCheck } from '../providers/leakcheck'
import { queryXposedOrNot } from '../providers/xposedOrNot'
import { checkRateLimit, clientKey } from '../rateLimit'
import { apiError, isAllowedOrigin, json, methodNotAllowed, readJsonBody } from '../responses'

/** Every provider adapter, keyed by id. */
const QUERIES: Record<
  ProviderId,
  (value: string, kind: LookupKind, deadline: number) => Promise<ProviderResult>
> = {
  // XposedOrNot only answers email lookups; the kind is re-checked by the caller.
  xposedornot: (value, _kind, deadline) => queryXposedOrNot(value, deadline),
  leakcheck: (value, kind, deadline) => queryLeakCheck(value, kind, deadline),
}

async function runProvider(
  id: ProviderId,
  value: string,
  kind: LookupKind,
  deadline: number,
): Promise<ProviderResult> {
  try {
    return await QUERIES[id](value, kind, deadline)
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
      exposedCategories: [],
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

interface LookupConfig {
  kind: LookupKind
  providerIds: ProviderId[]
  rateLimit: { limit: number; windowSeconds: number }
  route: string
}

const EMAIL_CONFIG: LookupConfig = {
  kind: 'email',
  providerIds: EMAIL_PROVIDER_IDS,
  rateLimit: RATE_LIMITS.checkEmail,
  route: 'check-email',
}

const USERNAME_CONFIG: LookupConfig = {
  kind: 'username',
  providerIds: USERNAME_PROVIDER_IDS,
  rateLimit: RATE_LIMITS.checkUsername,
  route: 'check-username',
}

async function runLookup(request: Request, config: LookupConfig): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')
  if (!isAllowedOrigin(request)) {
    return apiError(403, { code: 'invalid_request', message: 'Origin not allowed.' })
  }

  const limit = checkRateLimit(`${config.route}:${clientKey(request)}`, config.rateLimit)
  if (!limit.allowed) {
    safeLog('warn', 'rate limited', { route: config.route })
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

  const raw = config.kind === 'email' ? body.value.email : body.value.username
  const consent = body.value.consent

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return apiError(400, { code: 'invalid_request', message: 'The value is missing.' })
  }

  let value: string
  if (config.kind === 'email') {
    if (!isValidEmail(raw)) {
      return apiError(400, { code: 'invalid_email', message: 'The address is not valid.' })
    }
    value = normalizeEmail(raw)
  } else {
    const trimmed = raw.trim()
    if (!isValidUsername(trimmed)) {
      return apiError(400, { code: 'invalid_username', message: 'The username is not valid.' })
    }
    value = trimmed
  }

  // Explicit consent is required before anything leaves our server.
  if (consent !== true) {
    return apiError(400, {
      code: 'consent_required',
      message: 'Consent to query the external providers is required.',
    })
  }

  const startedAt = Date.now()
  const deadline = startedAt + LIMITS.lookupDeadlineMs

  const providers = await Promise.all(
    config.providerIds.map((id) => runProvider(id, value, config.kind, deadline)),
  )

  const breaches = mergeBreaches(providers)
  const totalProviders = config.providerIds.length
  const respondingProviders = providers.filter((provider) => provider.responded).length
  const state = deriveState(breaches.length, providers, totalProviders)

  const response: CheckResponse = {
    kind: config.kind,
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

  safeLog('info', 'lookup completed', {
    route: config.route,
    state,
    count: breaches.length,
    durationMs: response.durationMs,
  })

  return json(response)
}

export function handleCheckEmail(request: Request): Promise<Response> {
  return runLookup(request, EMAIL_CONFIG)
}

export function handleCheckUsername(request: Request): Promise<Response> {
  return runLookup(request, USERNAME_CONFIG)
}

/** Which providers answer each kind of lookup — used by /api/providers. */
export const PROVIDER_MATRIX = {
  email: EMAIL_PROVIDER_IDS,
  username: USERNAME_PROVIDER_IDS,
} as const
