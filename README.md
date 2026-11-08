# i have been leaked

A privacy-first data breach checker. French by default, English on demand.
Built with React 19, TypeScript, Vite, Tailwind CSS, and Netlify Functions or
Vercel Functions.

**No API key, no account and no environment variable is needed to run it.** Both
breach sources are queried over free, documented, keyless endpoints.

The guiding principle is stated in the interface itself: **an incomplete result
labelled as incomplete is better than a reassuring "you are fine" that happens
to be false.** No provider failure is ever converted into a clean result, and
nothing that would be a guess is ever displayed.

---

## What actually works

| Check | State | How |
| --- | --- | --- |
| **Email address** | ✅ Live | `XposedOrNot` + `LeakCheck` public API, both keyless, queried in parallel, normalised, merged, de-duplicated. |
| **Username** | ✅ Live | `LeakCheck` public API, the one free source that really supports username search. Coverage is narrower than email, and the UI says so. |
| **Password** | ✅ Live | Have I Been Pwned **Pwned Passwords** range API (free, unlimited, no key) with k-anonymity. Only a 5-character SHA-1 prefix leaves the browser. |
| **Phone number** | ⛔ Explicit unavailable state | International input + E.164 validation are real; the public tiers of both sources reserve phone search for paid plans. Nothing is invented. |

Everything else — navigation, FR/EN translation, error states, results page,
provider transparency, privacy policy, documentation — is complete.

### The real limits of "free" APIs

There is no such thing as a free, unlimited, keyless *email* breach API. These
are the documented quotas of the ones that are genuinely free:

| Source | Key | Quota | Notes |
| --- | --- | --- | --- |
| XposedOrNot `/v1/check-email/{email}?details=true` | none | 2 req/s, 25/hour, 100/day per IP | Breach names, dates, descriptions, exposed data |
| LeakCheck `/api/public?check=…` | none | 1 req/s | Sources and exposed-data *categories*; never the data. Requires a "Powered by LeakCheck" link for commercial use (present in the footer) |
| HIBP `/range/{prefix}` | none | none documented | Free and effectively unlimited |

Consequences, stated plainly:

1. **One request per provider per lookup.** XposedOrNot's `details=true` returns
   the optional metadata in the same call, halving quota consumption.
2. **Outbound calls are spaced** (`netlify/lib/throttle.ts`): 500 ms between
   XposedOrNot calls, 1 s between LeakCheck calls, per instance.
3. **A busy deployment can still hit a daily cap.** The providers answer `429`,
   which the UI reports as an *incomplete* lookup with the retry delay — never as
   clean. That is the correct behaviour, and it is not hidden.
4. **The 100 requests/day figure is per IP**, and serverless egress IPs are
   shared. For serious traffic, point `netlify/lib/config.ts` at a keyed plan —
   the adapters do not change.

### What is still missing, and why

1. **Phone coverage.** LeakCheck answers `Could not determine search type
   automatically` for a phone number on the public tier; the feature is paid.
   The phone checker therefore validates the number and reports an unavailable
   state. See *Extending the provider layer*.
2. **Fleet-wide rate limiting.** The built-in limiter is per function instance
   (see *Security model*).

---

## Architecture

```
index.html
netlify.toml                     Netlify: build · redirects · functions
vercel.json                      Vercel: SPA rewrite · security headers
api/                             Vercel entry points (same handlers as Netlify)
public/
  _headers                       CSP, HSTS, Permissions-Policy, cache rules
  favicon.svg  robots.txt
netlify/
  functions/                     Netlify entry points only (thin wrappers)
    check-email.ts  check-username.ts  password-range.ts  providers.ts  breach-stats.ts
  lib/
    config.ts                    ← every endpoint, timeout, limit, key name
    http.ts                      deadline-aware fetch + tolerant payload readers
    normalize.ts                 one breach shape for all providers
    merge.ts                     cross-provider de-duplication
    log.ts                       PII-scrubbing logger
    rateLimit.ts                 salted-hash fixed window
    responses.ts                 security headers, origin check, body limits
    throttle.ts                  outbound spacing, per provider quota
    providers/
      xposedOrNot.ts  leakcheck.ts  ← one adapter per source
    handlers/
      checkLookup.ts  passwordRange.ts  providers.ts  breachStats.ts
src/
  types/index.ts                 shared domain types (client + server)
  i18n/  fr.ts  en.ts  index.tsx  ← flat typed dictionary, no missing keys
  services/                      api client, pwnedPasswords, providers, check
  components/                    Header, Footer, forms, results, provider status…
    ui/                          Button, Card, Badge, TextField, Select, Feedback
  pages/                         Home, 4 checkers, shared Results, About, Privacy, Docs
  utils/                         validation, phone, exposure mapping, formatting
  state/ResultsContext.tsx       in-memory only — never persisted
tests/                           123 unit + component tests
```

### Request flow — email and username

```
browser ──POST /api/check-email    {email, consent:true}──┐
        ──POST /api/check-username {username, consent:true}┤
                                                            ▼
                                                  function (shared)
                              ┌─────────────────────────────┴──────────────┐
                              ▼                                            ▼
              XposedOrNot check-email?details=true              LeakCheck /api/public
              (email only)                                      (email + username)
                              └───────────────┬────────────────────────────┘
                                              ▼
                          normalise → merge → derive state
                                              ▼
             { kind, state, breaches[], providers[ {status, responded, error} ] }
```

Each endpoint queries only the adapters that really support that identifier —
the username route never calls XposedOrNot, which has no username endpoint.

The verdict is derived, never assumed:

```ts
if (breaches.length > 0)      return 'breached'    // red
if (respondedProviders === 0) return 'error'       // never "clean"
if (respondedProviders < totalProviders) return 'incomplete'  // amber
return 'clean'                                     // green
```

`totalProviders` counts every source that *should* answer, so a silenced
provider turns green into amber instead of silently shrinking the denominator.

### Request flow — password (k-anonymity)

```
browser: SHA-1(password) via WebCrypto
         └─ sends "5BAA6" to api.pwnedpasswords.com/range/5BAA6?add-padding=true
            (fallback: our /api/password-range relay, for blocked networks)
         └─ compares the remaining 35 characters locally
         └─ clears the field
```

The full digest never leaves the tab, is never returned by any function, and is
never placed in a URL. `Add-Padding` rows (count `0`) are ignored.

---

## Internal API

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/check-email` | `{ email, consent: true }`. `no-store`. 8 req/min/IP. |
| `POST` | `/api/check-username` | `{ username, consent: true }`. `no-store`. 8 req/min/IP. |
| `GET` | `/api/password-range?prefix=ABCDE` | Relay for the range API; 5 hex chars only. |
| `GET` | `/api/providers` | Capability matrix + configuration state. |
| `GET` | `/api/breach-stats` | Real aggregates from the XposedOrNot public index. |

Every response carries `Cache-Control: no-store` (except the non-personal
provider matrix and the aggregates, which are explicitly cacheable), plus
`X-Content-Type-Options` and `Referrer-Policy` headers.

---

## Security model

**Never stored**

- No database, no accounts, no search history.
- The only `localStorage` key is `ihl.language`.
- Results live in a React context; a refresh drops them on purpose.
- `localStorage`, `sessionStorage`, cookies and URL state are never used for
  lookups, passwords or hashes.

**Never logged**

- The queried identifier is never passed to the logger at all.
- `netlify/lib/log.ts` additionally scrubs anything that looks like an email
  address, a long digit run or a hex digest, and only accepts an allow-list of
  metadata keys.
- Server-side errors from providers are reduced to a status code; the response
  body of a failing provider is never echoed.

**Never trusted**

- Client and server run the *same* validation function.
- Bodies are capped at 4 KB, must be JSON objects, and the cross-origin check
  rejects browser calls from other sites (no cookies exist, so this protects
  provider quota rather than the user).
- Every outbound call has a deadline (`AbortController`); the whole lookup has a
  9 s budget, under Netlify's 10 s synchronous limit.
- Timeouts, `429`, `5xx`, unparseable payloads, unknown schemas and missing keys
  are all distinct states in the response — and the UI translates each one.
- A provider body that *looks* successful but contradicts itself (e.g. LeakCheck
  reporting matches without naming a source) is rejected as `invalid_response`
  rather than being read as "no breach" — the one mistake this project must
  never make.

**Headers** (`public/_headers` on Netlify, `headers` in `vercel.json` on Vercel):
strict CSP (`connect-src` allows only our own
origin plus `api.pwnedpasswords.com`), HSTS, `nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`,
`frame-ancestors 'none'`.

**Abuse protection**: salted-hash fixed-window limiter, 8 lookups/min/IP for
`check-email`, 60/min for password ranges, 30/min for stats. The raw IP is never
stored and the salt is per instance. For fleet-wide limits, add a Netlify
rate-limit rule or a shared counter (Netlify Blobs, Upstash) in front of the
function — the limiter is deliberately a single small module so it can be
replaced without touching the handlers.

**Honest about anonymity**: the disclosure before the checkbox states plainly
that XposedOrNot and LeakCheck necessarily see the value they are asked to check.
No "anonymous" claim is made anywhere.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` does not mock anything: `vite.config.ts` loads the **real**
Netlify Function handlers through Vite's SSR pipeline and serves them on
`/api/*`, so timeouts, rate limits, merging and provider failures behave exactly
as they will in production.

```bash
npm run typecheck  # tsc --noEmit (strict, no unused locals)
npm test           # 123 tests: validation, normalisation, merge, providers,
                   # handlers, password protocol, i18n parity, UI flows
npm run build      # typecheck + bundle to dist/
npm run preview    # serve the production build
```

### Tests worth knowing about

- `tests/providers.test.ts` — every failure mode is asserted to be *not* clean:
  `429`, `5xx`, network error, abort, unparseable body, unknown schema, missing key.
- `tests/checkLookup.test.ts` — consent gating, `no-store`, 429 burst, merging
  across both sources, the username route calling only LeakCheck, and proof that
  the submitted value never appears in an error payload.
- `tests/password.test.ts` — the request URL contains the prefix and *not* the
  rest of the digest; padding rows are ignored; the password is absent from
  storage.
- `tests/i18n.test.tsx` — French and English define exactly the same keys, with
  exactly the same `{placeholders}`, and every pluralised key has both forms.
- `tests/ui.test.tsx` — the form refuses to send without consent, the four
  result states render their distinct copy, and switching language writes one
  storage key.

---

## Deployment (Netlify)

1. Push the repository to GitHub and connect it in Netlify.
2. `netlify.toml` already declares everything:
   - build `npm run build`, publish `dist`
   - functions `netlify/functions`, esbuild bundler
   - `/api/*` rewrites to the functions (declared **before** the SPA fallback)
   - `public/_headers` applied at the edge
3. No environment variables are required.
4. Deploy. Verify:
   - `GET /api/providers` → `xposedornot` and `leakcheck` both `configured: true`
   - a lookup for a known-leaked address → red state, provider statuses listed
   - switch off the network for one provider → amber "incomplete", never green

Or from the CLI:

```bash
npm install -g netlify-cli
netlify link
netlify deploy --build --prod
```

### Notes

- Netlify's synchronous function limit is 10 s; the internal budget is 9 s
  (`LIMITS.lookupDeadlineMs`) so the function always answers with a state
  instead of being killed.
- `npm run dev` is the only Vite-only path; nothing depends on a database,
  a paid service or an API key to render and behave correctly.

## Deployment (Vercel)

The same handlers run on Vercel through Web-standard function entry points.

1. Import the repository in Vercel (framework preset: **Vite**).
2. `vercel.json` already declares the build, the SPA rewrite
   (`/((?!api/).*) → /index.html`) and the security headers.
3. Every file in `api/` becomes a function at the matching `/api/*` path:
   `check-email`, `check-username`, `password-range`, `providers`, `breach-stats`.
   Those files are **generated bundles** (`npm run build:api`, run by `npm run
   build`): Vercel loads `api/*.js` as plain Node modules, so a relative import
   of a TypeScript file outside `api/` would not resolve at runtime. Bundling
   keeps one source of truth — the handlers in `netlify/lib/handlers/` — and the
   bundles contain no duplicated logic.
4. No environment variables are required.

```bash
npm i -g vercel
vercel --prod
```

Netlify-specific files (`netlify.toml`, `public/_headers`) are ignored by Vercel,
and `vercel.json` + `api/` are ignored by Netlify — the two deployments coexist
without changing a line of application code.

---

## Extending the provider layer

1. Declare the source in `netlify/lib/config.ts`:

```ts
export const PROVIDERS = {
  // …
  myprovider: {
    id: 'myprovider',
    displayName: 'My Provider',
    homepage: 'https://example.com',
    documentation: 'https://example.com/docs',
    lookups: ['phone'],              // ← the capability you can really deliver
    coverage: 'One factual sentence.',
    timeoutMs: 6000,
    minIntervalMs: 1000,
    quota: '1 request/s',
    apiKeyEnvVar: 'MYPROVIDER_API_KEY',
    endpoints: { checkEmail: (email) => `https://api.example.com/check/${encodeURIComponent(email)}` },
    setupNote: 'Requires MYPROVIDER_API_KEY.',
    terms: 'https://example.com/terms',
  },
}
```

A provider without a key is fully supported: set `apiKeyEnvVar: null` and the
adapter is queried straight away, like the two shipped sources.

2. Implement `queryMyProvider(value, deadline): Promise<ProviderResult>` in
   `netlify/lib/providers/`, returning the shared shape — and **never** mapping
   a failure to `not_found`.
3. Register it in `QUERIES` (`handlers/checkLookup.ts`), add its id to
   `EMAIL_PROVIDER_IDS` / `USERNAME_PROVIDER_IDS` / `PHONE_PROVIDER_IDS`, and the
   capability matrix (`handlers/providers.ts`) follows automatically.
4. Nothing else: normalisation, merging, status display, verdict derivation and
   translation are already provider-agnostic. Adding a key to the dictionary is
   the only UI work, and `en.ts` is typed against `fr.ts` so a missing
   translation is a compile error.

---

## Design notes

- Palette exactly as specified: `#08090C` base, `#101217` surface, `#151820`
  cards, `#242832` borders, `#EF4444` / `#B91C1C` reds, `#22C55E`, `#F59E0B`.
- Inter (self-hosted via Fontsource, no external font CDN) and JetBrains Mono for
  technical values. No third-party request is made to render the page.
- Motion: one fade on route change, one staggered rise per section, an
  indeterminate sweep for the loading bar. All of it collapses to ~0 ms under
  `prefers-reduced-motion: reduce`.
- Mobile: single column, 44 px+ touch targets, no fixed widths, no horizontal
  scroll (`overflow-x: clip`, which keeps the sticky header working — `hidden`
  would not), the header collapses into a 46 px-row panel.
- Accessibility: skip link, roving-tabindex arrow keys on the category tabs,
  focus moved into `<main>` on navigation, `aria-live` on every asynchronous
  result, and all text colours measured at ≥ 4.5:1 against their background.
- Resilience: a route-level error boundary keeps the header and footer and
  explains that a reload is all that is needed — no error monitoring sees
  anything, so nothing is reported anywhere.
- The hero grid texture and the red glow are the only decorations; there are no
  gradient-text headings and no glows on cards.

---

## Licence

Apache License 2.0 — see `LICENSE`.

Not affiliated with XposedOrNot, LeakCheck or Have I Been Pwned. Provider terms and
rate limits must be respected; the adapters make one request per provider per
lookup, with no retries and no caching of personal results.
