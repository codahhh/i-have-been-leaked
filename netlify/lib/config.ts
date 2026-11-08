/**
 * Centralised provider configuration.
 *
 * Every endpoint, timeout, rate limit and credential lookup for the whole
 * application lives here — nothing provider-specific is hardcoded anywhere
 * else (frontend included: the UI reads capabilities from `/api/providers`).
 *
 * Secrets are read from the environment at request time and are never
 * serialised, returned or logged.
 */

import type { LookupCapability, ProviderId } from '../../src/types/index'

export interface ProviderDefinition {
  id: ProviderId
  displayName: string
  homepage: string
  documentation: string
  /** Lookups this provider is able to answer. */
  lookups: LookupCapability[]
  /** One-sentence, factual description of the coverage (shown in the UI). */
  coverage: string
  /** Per-request deadline. */
  timeoutMs: number
  /** Name of the environment variable holding the API key, if any. */
  apiKeyEnvVar: string | null
  endpoints: {
    checkEmail: (email: string) => string
    /** Optional enrichment endpoint, best-effort. */
    enrichEmail?: (email: string) => string
    /** Public breach index used for aggregate statistics only. */
    breachIndex?: string
  }
  /** Free-text note surfaced in the UI when credentials are missing. */
  setupNote: string
  terms: string
}

const XPOSEDORNOT_BASE = 'https://api.xposedornot.com'

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  xposedornot: {
    id: 'xposedornot',
    displayName: 'XposedOrNot',
    homepage: 'https://xposedornot.com',
    documentation: 'https://xposedornot.com/api_doc',
    lookups: ['email'],
    coverage:
      'Open breach index covering thousands of publicly disclosed breaches. Free email endpoint, no key required.',
    timeoutMs: 6000,
    apiKeyEnvVar: null,
    endpoints: {
      checkEmail: (email) =>
        `${XPOSEDORNOT_BASE}/v1/check-email/${encodeURIComponent(email)}`,
      enrichEmail: (email) =>
        `${XPOSEDORNOT_BASE}/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      breachIndex: `${XPOSEDORNOT_BASE}/v1/breaches`,
    },
    setupNote:
      'Works without credentials. Anonymous requests are rate limited by the provider.',
    terms: 'https://xposedornot.com/privacy',
  },

  orelys: {
    id: 'orelys',
    displayName: 'Orelys',
    homepage: 'https://orelys.io',
    documentation: 'https://api.orelys.io',
    lookups: ['email'],
    coverage:
      'Secondary email breach source queried alongside XposedOrNot so that a gap in one index does not become a false negative.',
    timeoutMs: 6000,
    apiKeyEnvVar: 'ORELYS_API_KEY',
    endpoints: {
      checkEmail: () => 'https://api.orelys.io/v1/breaches/check',
    },
    setupNote:
      'Requires the ORELYS_API_KEY environment variable (and, if your plan documents it, ORELYS_API_KEY_HEADER). Until it is set, Orelys is reported as “not configured” and results are marked incomplete — never as clean.',
    terms: 'https://orelys.io/terms',
  },
}

/** Providers queried by the email checker, in display order. */
export const EMAIL_PROVIDER_IDS: ProviderId[] = ['xposedornot', 'orelys']

/** Have I Been Pwned — Pwned Passwords range API (k-anonymity, no key). */
export const PWNED_PASSWORDS = {
  rangeUrl: (prefix: string) =>
    `https://api.pwnedpasswords.com/range/${encodeURIComponent(prefix)}`,
  timeoutMs: 5000,
  /** Prefix responses are non-identifying and cached briefly for resilience. */
  cacheSeconds: 3600,
  homepage: 'https://haveibeenpwned.com/Passwords',
  terms: 'https://haveibeenpwned.com/API/v3#License',
} as const

/** Public breach index used for the homepage statistics. */
export const STATS = {
  cacheSeconds: 6 * 60 * 60,
  timeoutMs: 6000,
  source: 'XposedOrNot public breach index',
  sourceUrl: 'https://xposedornot.com/',
} as const

/** Abuse protection. Per-instance, in-memory (see README for scaling notes). */
export const RATE_LIMITS = {
  checkEmail: { limit: 8, windowSeconds: 60 },
  passwordRange: { limit: 60, windowSeconds: 60 },
  providers: { limit: 60, windowSeconds: 60 },
  breachStats: { limit: 30, windowSeconds: 60 },
} as const

/** Hard limits enforced on incoming requests. */
export const LIMITS = {
  maxBodyBytes: 4096,
  /** Overall server-side budget for one email lookup (Netlify caps at 10s). */
  lookupDeadlineMs: 9000,
  /** Extra budget granted to the optional enrichment call. */
  enrichmentBudgetMs: 3000,
  userAgent: 'i-have-been-leaked/1.0 (+https://github.com/codahhh/i-have-been-leaked)',
} as const

export function isProviderConfigured(definition: ProviderDefinition): boolean {
  if (!definition.apiKeyEnvVar) return true
  const value = readEnv(definition.apiKeyEnvVar)
  return typeof value === 'string' && value.trim().length > 0
}

export function readEnv(name: string): string | undefined {
  // Netlify exposes functions' environment through `process.env`.
  const value = typeof process !== 'undefined' ? process.env?.[name] : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
