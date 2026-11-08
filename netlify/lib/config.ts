/**
 * Centralised provider configuration.
 *
 * Every endpoint, timeout, rate limit and credential lookup for the whole
 * application lives here — nothing provider-specific is hardcoded anywhere
 * else (frontend included: the UI reads capabilities from `/api/providers`).
 *
 * Both providers below are **free and keyless**: the deployment works with no
 * environment variables at all. Their published limits are respected by the
 * throttle in `throttle.ts` plus the per-client rate limiter in `rateLimit.ts`.
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
  /** Minimum spacing between two calls to this provider, per instance. */
  minIntervalMs: number
  /** Documented quota, surfaced verbatim in the UI and the README. */
  quota: string
  /** Name of the environment variable holding the API key, if any. */
  apiKeyEnvVar: string | null
  endpoints: {
    checkEmail?: (email: string) => string
    checkUsername?: (username: string) => string
    /** Receives E.164 digits only — no `+`, no separators. */
    checkPhone?: (digits: string) => string
    /** Public breach index used for aggregate statistics only. */
    breachIndex?: string
  }
  /** Free-text note surfaced in the UI when credentials are missing. */
  setupNote: string
  terms: string
}

const XPOSEDORNOT_BASE = 'https://api.xposedornot.com'
const LEAKCHECK_PUBLIC_BASE = 'https://leakcheck.io/api/public'

export const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  xposedornot: {
    id: 'xposedornot',
    displayName: 'XposedOrNot',
    homepage: 'https://xposedornot.com',
    documentation: 'https://xposedornot.com/api_doc',
    lookups: ['email'],
    coverage:
      'Open breach index covering thousands of publicly disclosed breaches. Free email endpoint, no key required.',
    timeoutMs: 6500,
    minIntervalMs: 500,
    quota: '2 requests/s, 25/hour, 100/day per IP',
    apiKeyEnvVar: null,
    endpoints: {
      // `details=true` returns breach names *and* their metadata in a single
      // call, which halves the quota consumed per lookup.
      checkEmail: (email) =>
        `${XPOSEDORNOT_BASE}/v1/check-email/${encodeURIComponent(email)}?details=true`,
      breachIndex: `${XPOSEDORNOT_BASE}/v1/breaches`,
    },
    setupNote:
      'Works without credentials. Anonymous requests are rate limited by the provider.',
    terms: 'https://xposedornot.com/privacy',
  },

  leakcheck: {
    id: 'leakcheck',
    displayName: 'LeakCheck',
    homepage: 'https://leakcheck.io',
    documentation: 'https://docs.leakcheck.io/public-api/lookup',
    lookups: ['email', 'username', 'phone'],
    coverage:
      'Public API over 10B+ leaked records. Answers email, username and phone lookups, and reports the breach sources and the categories of exposed data — never the data itself.',
    timeoutMs: 5000,
    minIntervalMs: 1000,
    quota: '1 request/s (public tier)',
    apiKeyEnvVar: null,
    endpoints: {
      checkEmail: (email) =>
        `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(email)}`,
      checkUsername: (username) =>
        `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(username)}`,
      // The public tier resolves a phone number only when it is sent as bare
      // E.164 digits with `type=phone`; with a leading `+` it answers
      // "Could not determine search type automatically" (verified 2026-11-08).
      checkPhone: (digits) =>
        `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(digits)}&type=phone`,
    },
    setupNote:
      'Works without credentials. The public tier is free, including commercial use, and requires a “Powered by LeakCheck” link.',
    terms: 'https://leakcheck.io/terms',
  },
}

/** Providers queried by the email checker, in display order. */
export const EMAIL_PROVIDER_IDS: ProviderId[] = ['xposedornot', 'leakcheck']

/** Providers queried by the username checker, in display order. */
export const USERNAME_PROVIDER_IDS: ProviderId[] = ['leakcheck']

/**
 * Providers queried by the phone checker.
 *
 * LeakCheck's free public tier does answer phone searches: with E.164 digits
 * and `type=phone` it returns the same source/fields payload as an email
 * lookup. XposedOrNot has no phone endpoint, so it is absent here. Coverage is
 * a single source, and the UI says so rather than implying completeness.
 */
export const PHONE_PROVIDER_IDS: ProviderId[] = ['leakcheck']

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
  checkUsername: { limit: 8, windowSeconds: 60 },
  checkPhone: { limit: 8, windowSeconds: 60 },
  passwordRange: { limit: 60, windowSeconds: 60 },
  providers: { limit: 60, windowSeconds: 60 },
  breachStats: { limit: 30, windowSeconds: 60 },
} as const

/** Hard limits enforced on incoming requests. */
export const LIMITS = {
  maxBodyBytes: 4096,
  /** Largest provider body we are willing to buffer and parse. */
  maxResponseBytes: 4_000_000,
  /** Overall server-side budget for one lookup (Netlify caps at 10s). */
  lookupDeadlineMs: 9000,
  userAgent: 'i-have-been-leaked/1.0 (+https://github.com/codahhh/i-have-been-leaked)',
} as const

export function isProviderConfigured(definition: ProviderDefinition): boolean {
  if (!definition.apiKeyEnvVar) return true
  const value = readEnv(definition.apiKeyEnvVar)
  return typeof value === 'string' && value.trim().length > 0
}

export function readEnv(name: string): string | undefined {
  // Serverless runtimes expose functions' environment through `process.env`.
  const value = typeof process !== 'undefined' ? process.env?.[name] : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
