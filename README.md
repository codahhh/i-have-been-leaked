# i have been leaked

A privacy-first data breach checker. French by default, English on demand.
Built with React 19, TypeScript, Vite, Tailwind CSS and Netlify Functions.

The guiding principle is stated in the interface itself: **an incomplete result
labelled as incomplete is better than a reassuring "you are fine" that happens
to be false.** No provider failure is ever converted into a clean result, and
nothing that would be a guess is ever displayed.

---

## What actually works

| Check | State | How |
| --- | --- | --- |
| **Email address** | ✅ Live | `XposedOrNot` (no key) + `Orelys` (key required), queried in parallel, normalised, merged, de-duplicated. |
| **Password** | ✅ Live | Have I Been Pwned **Pwned Passwords** range API with k-anonymity. Only a 5-character SHA-1 prefix leaves the browser. |
| **Username** | ⛔ Explicit unavailable state | No free, universal, lawful source exists. The form validates input and then says so. |
| **Phone number** | ⛔ Explicit unavailable state | International input + E.164 validation are real; coverage is not. Nothing is invented. |

Everything else — navigation, FR/EN translation, error states, results page,
provider transparency, privacy policy, documentation — is complete.

### What remains to be configured

1. **Orelys.** Add `ORELYS_API_KEY` in the Netlify environment. Until then the
   provider is displayed as *not configured* and every email lookup is marked
   **incomplete** rather than clean. If your plan documents a custom auth
   header, set `ORELYS_API_KEY_HEADER` / `ORELYS_API_KEY_PREFIX`.
2. **Username and phone providers.** Both need a licensed data source; see
   *Extending the provider layer* below. The UI already reads its capability
   matrix from `/api/providers`, so no interface change is required.
3. **Fleet-wide rate limiting.** The built-in limiter is per function instance
   (see *Security model*).

---

## Architecture

```
index.html
netlify.toml                     build · redirects · functions
public/
  _headers                       CSP, HSTS, Permissions-Policy, cache rules
  favicon.svg  robots.txt
netlify/
  functions/                     HTTP entry points only (thin wrappers)
    check-email.ts  password-range.ts  providers.ts  breach-stats.ts
  lib/
    config.ts                    ← every endpoint, timeout, limit, key name
    http.ts                      deadline-aware fetch + tolerant payload readers
    normalize.ts                 one breach shape for all providers
    merge.ts                     cross-provider de-duplication
    log.ts                       PII-scrubbing logger
    rateLimit.ts                 salted-hash fixed window
    responses.ts                 security headers, origin check, body limits
    providers/
      xposedOrNot.ts  orelys.ts  ← one adapter per source
    handlers/
      checkEmail.ts  passwordRange.ts  providers.ts  breachStats.ts
src/
  types/index.ts                 shared domain types (client + server)
  i18n/  fr.ts  en.ts  index.tsx  ← flat typed dictionary, no missing keys
  services/                      api client, pwnedPasswords, providers, emailCheck
  components/                    Header, Footer, forms, results, provider status…
    ui/                          Button, Card, Badge, TextField, Select, Feedback
  pages/                         Home, 4 checkers, results, About, Privacy, Docs
  utils/                         validation, phone, exposure mapping, formatting
  state/ResultsContext.tsx       in-memory only — never persisted
tests/                           113 unit + component tests
```

### Request flow — email

```
browser ──POST /api/check-email {email, consent:true}──▶ Netlify Function
                                                          │
                              ┌───────────────────────────┴──────────────┐
                              ▼                                          ▼
                    XposedOrNot check-email                    Orelys /breaches/check
                    (+ best-effort analytics)                  (if configured)
                              └───────────────┬──────────────────────────┘
                                              ▼
                          normalise → merge → derive state
                                              ▼
             { state, breaches[], providers[ {status, responded, error} ] }
```

The verdict is derived, never assumed:

```ts
if (breaches.length > 0)      return 'breached'    // red
if (respondedProviders === 0) return 'error'       // never "clean"
if (respondedProviders < totalProviders) return 'incomplete'  // amber
return 'clean'                                     // green
```

`totalProviders` counts every source that *should* answer, so a missing API key
turns green into amber instead of silently shrinking the denominator.

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

**Headers** (`public/_headers`): strict CSP (`connect-src` allows only our own
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
that XposedOrNot and Orelys necessarily see the address they are asked to check.
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
npm test           # 113 tests: validation, normalisation, merge, providers,
                   # handler, password protocol, i18n parity, UI flows
npm run build      # typecheck + bundle to dist/
npm run preview    # serve the production build
```

### Tests worth knowing about

- `tests/providers.test.ts` — every failure mode is asserted to be *not* clean:
  `429`, `5xx`, network error, abort, unparseable body, unknown schema, missing key.
- `tests/checkEmail.test.ts` — consent gating, `no-store`, 429 burst, and proof
  that the submitted address never appears in an error payload.
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
3. Add environment variables (Site settings → Environment variables):
   ```
   ORELYS_API_KEY=<your key>        # optional but recommended
   ```
4. Deploy. Verify:
   - `GET /api/providers` → `xposedornot.configured = true`
   - a lookup for a known-leaked address → red state, provider statuses listed
   - a lookup with Orelys unset → amber "incomplete", never green

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
- ``npm run dev`` is the only Vite-only path; nothing depends on a database,
  a paid service or an API key to render and behave correctly.

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
    lookups: ['username'],           // ← claimed capability
    coverage: 'One factual sentence.',
    timeoutMs: 6000,
    apiKeyEnvVar: 'MYPROVIDER_API_KEY',
    endpoints: { checkEmail: (email) => `https://api.example.com/check/${encodeURIComponent(email)}` },
    setupNote: 'Requires MYPROVIDER_API_KEY.',
    terms: 'https://example.com/terms',
  },
}
```

2. Implement `queryMyProvider(email, deadline): Promise<ProviderResult>` in
   `netlify/lib/providers/`, returning the shared shape — and **never** mapping
   a failure to `not_found`.
3. Register it in `PROVIDER_QUERIES` (`handlers/checkEmail.ts`) and, for another
   lookup type, in the capability matrix (`handlers/providers.ts`).
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
- The hero grid texture and the red glow are the only decorations; there are no
  gradient-text headings and no glows on cards.

---

## Licence

Apache License 2.0 — see `LICENSE`.

Not affiliated with XposedOrNot, Orelys or Have I Been Pwned. Provider terms and
rate limits must be respected; the adapters make one request per provider per
lookup, with no retries and no caching of personal results.
