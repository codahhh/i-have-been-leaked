/**
 * Shared domain types.
 *
 * This module is imported by both the browser bundle and the Netlify
 * Functions runtime, therefore it must stay free of runtime side effects
 * (type declarations only — always import it with `import type`).
 */

/* -------------------------------------------------------------------------- */
/*  Providers                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Stable identifiers for every breach-intelligence provider we know about.
 *
 * Both providers below are queried over documented, keyless, free endpoints —
 * a deployment needs no environment variables to be fully functional.
 */
export type ProviderId = 'xposedornot' | 'leakcheck'

/**
 * Outcome of a single provider query.
 *
 * `ok`            – the provider answered and its answer is trustworthy
 * `not_found`     – the provider answered "no match" (a positive, reliable answer)
 * `not_configured`– credentials are missing, the provider cannot be queried
 * `unavailable`   – network error, 5xx, DNS failure, provider outage
 * `timeout`       – the request exceeded our deadline
 * `rate_limited`  – HTTP 429 (or an equivalent provider signal)
 * `invalid_response` – the provider answered something we could not parse
 */
export type ProviderStatusKind =
  | 'ok'
  | 'not_found'
  | 'not_configured'
  | 'unavailable'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_response'

/** Machine-readable error codes surfaced to the UI (translated client-side). */
export type ProviderErrorCode =
  | 'network_error'
  | 'timeout'
  | 'rate_limited'
  | 'provider_error'
  | 'not_configured'
  | 'unauthorized'
  | 'invalid_response'
  | 'unknown'

export interface ProviderError {
  code: ProviderErrorCode
  /** Technical, non-sensitive detail. Never contains the queried address. */
  detail: string | null
  /** Seconds to wait, when the provider told us (429 / Retry-After). */
  retryAfterSeconds: number | null
}

/** A breach record after normalisation, identical in shape across providers. */
export interface NormalizedBreach {
  /** Deterministic, non-reversible identifier used for de-duplication. */
  id: string
  name: string
  domain: string | null
  /** ISO date (`YYYY-MM-DD`), `YYYY-MM` or `YYYY` depending on the source. */
  breachDate: string | null
  exposedData: string[]
  /** Provider that produced this record first. */
  source: string
  /** Every provider that reported this breach (after the merge). */
  sources: string[]
  /** Free-form description, when the provider exposes one. */
  description: string | null
  /** Number of exposed accounts, when known. */
  pwnCount: number | null
}

/** Raw result of a provider query, before merging. */
export interface ProviderResult {
  provider: ProviderId
  displayName: string
  status: ProviderStatusKind
  /** True only when the provider gave a usable answer (ok or not_found). */
  responded: boolean
  breaches: NormalizedBreach[]
  /**
   * Data categories the provider reports for this query, when it only exposes
   * them at the query level (LeakCheck reports one aggregate list rather than
   * one list per source). Rendered as such — never attributed per breach.
   */
  exposedCategories: string[]
  error: ProviderError | null
  /** ISO timestamp of when the query was sent. */
  queriedAt: string
  durationMs: number
}

/* -------------------------------------------------------------------------- */
/*  Email lookup                                                              */
/* -------------------------------------------------------------------------- */

/** Aggregated verdict for one email lookup. Maps to the green/red/yellow UI. */
export type LookupState =
  /** No match, and at least one provider answered reliably. */
  | 'clean'
  /** One or more matching breaches. */
  | 'breached'
  /** No match, but coverage is incomplete (a provider failed or is missing). */
  | 'incomplete'
  /** Nothing useful could be established. Never presented as "safe". */
  | 'error'

/** Lookup kinds that have a real, working data source. */
export type LookupKind = 'email' | 'username'

export interface CheckResponse {
  /** Which checker produced this result. */
  kind: LookupKind
  ok: boolean
  state: LookupState
  checkedAt: string
  totalBreaches: number
  breaches: NormalizedBreach[]
  providers: ProviderResult[]
  respondingProviders: number
  totalProviders: number
  durationMs: number
  /** Set when the request itself was rejected (bad input, rate limit, ...). */
  error?: ApiError
}

export interface ApiError {
  code:
    | 'invalid_email'
    | 'invalid_username'
    | 'invalid_request'
    | 'consent_required'
    | 'rate_limited'
    | 'method_not_allowed'
    | 'internal_error'
    | 'invalid_prefix'
  message: string
  retryAfterSeconds?: number
}

/* -------------------------------------------------------------------------- */
/*  Password range (k-anonymity)                                              */
/* -------------------------------------------------------------------------- */

export interface PasswordRangeResponse {
  prefix: string
  /** Hash suffixes (35 hex chars, uppercase) mapped to exposure counts. */
  suffixes: Record<string, number>
}

/* -------------------------------------------------------------------------- */
/*  Provider registry / capabilities                                          */
/* -------------------------------------------------------------------------- */

export type LookupCapability = 'email' | 'username' | 'phone'

export interface ProviderCapabilityEntry {
  id: ProviderId
  displayName: string
  /** Short, factual description of what the provider covers. */
  coverage: string
  homepage: string
  lookups: LookupCapability[]
  /** False when required credentials are absent on this deployment. */
  configured: boolean
  /** Whether this provider is queried by the email checker right now. */
  activeForEmail: boolean
  /** Whether this provider is queried by the username checker right now. */
  activeForUsername: boolean
}

export interface ProvidersResponse {
  providers: ProviderCapabilityEntry[]
  /** Providers currently able to answer an email lookup. */
  emailProviders: ProviderId[]
  /** Providers able to answer a username lookup. */
  usernameProviders: ProviderId[]
  /**
   * Providers able to answer a phone lookup. Still empty: the free tiers we
   * use do not expose phone search (LeakCheck reserves it for paid plans).
   */
  phoneProviders: ProviderId[]
  /** True when the Pwned Passwords range API is reachable server-side. */
  passwordRangeAvailable: boolean
}

/* -------------------------------------------------------------------------- */
/*  Public breach statistics                                                  */
/* -------------------------------------------------------------------------- */

export interface BreachStats {
  available: boolean
  source: string
  sourceUrl: string
  totalBreaches: number
  totalRecords: number | null
  latestBreach: { name: string; date: string | null } | null
  /** ISO timestamp of when the figures were fetched. */
  fetchedAt: string
}
