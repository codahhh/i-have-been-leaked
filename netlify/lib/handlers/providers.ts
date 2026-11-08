/**
 * GET /api/providers
 *
 * Exposes the provider capability matrix so the UI never hardcodes which
 * sources exist, what they cover, or whether this deployment is configured
 * for them. Single source of truth: netlify/lib/config.ts.
 */

import type { ProviderCapabilityEntry, ProvidersResponse } from '../../../src/types/index'
import { EMAIL_PROVIDER_IDS, PROVIDERS, RATE_LIMITS, isProviderConfigured } from '../config'
import { checkRateLimit, clientKey } from '../rateLimit'
import { apiError, json, methodNotAllowed } from '../responses'

export function handleProviders(request: Request): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed('GET')

  const limit = checkRateLimit(`providers:${clientKey(request)}`, RATE_LIMITS.providers)
  if (!limit.allowed) {
    return apiError(429, {
      code: 'rate_limited',
      message: 'Too many requests.',
      retryAfterSeconds: limit.retryAfterSeconds,
    })
  }

  const providers: ProviderCapabilityEntry[] = Object.values(PROVIDERS).map((definition) => ({
    id: definition.id,
    displayName: definition.displayName,
    coverage: definition.coverage,
    homepage: definition.homepage,
    lookups: definition.lookups,
    configured: isProviderConfigured(definition),
    activeForEmail: EMAIL_PROVIDER_IDS.includes(definition.id),
  }))

  const payload: ProvidersResponse = {
    providers,
    emailProviders: EMAIL_PROVIDER_IDS.filter((id) => isProviderConfigured(PROVIDERS[id])),
    // V1: no licensed source covers usernames or phone numbers. Stated
    // explicitly rather than faked — see the README for the extension path.
    usernameProviders: [],
    phoneProviders: [],
    passwordRangeAvailable: true,
  }

  return json(payload, { headers: { 'Cache-Control': 'public, max-age=300' } })
}
