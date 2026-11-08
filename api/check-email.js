/**
 * GENERATED FILE — do not edit.
 * Source: netlify/lib/handlers/* , bundled by scripts/build-vercel-api.mjs.
 * Regenerate with: npm run build:api
 */


// src/utils/validation.ts
var MAX_EMAIL_LENGTH = 254;
var MAX_LOCAL_PART_LENGTH = 64;
function isValidEmail(raw) {
  const email = raw.trim();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false;
  if (/\s/.test(email)) return false;
  if (email.includes("..")) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length === 0 || local.length > MAX_LOCAL_PART_LENGTH) return false;
  if (domain.length === 0 || domain.length > 253) return false;
  const localPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPattern.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (!/^[A-Za-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  const tld = labels[labels.length - 1];
  return /^[A-Za-z]{2,}$/.test(tld);
}
function normalizeEmail(raw) {
  return raw.trim().toLowerCase();
}
var USERNAME_MIN_LENGTH = 3;
var USERNAME_MAX_LENGTH = 64;
function isValidUsername(raw) {
  const value = raw.trim();
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) return false;
  return /^[A-Za-z0-9._-]+$/.test(value);
}
var PHONE_MIN_DIGITS = 7;
var PHONE_MAX_DIGITS = 15;
function toPhoneDigits(raw) {
  const compact = raw.trim().replace(/[\s().-]/g, "");
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(withoutPlus)) return null;
  if (withoutPlus.length < PHONE_MIN_DIGITS || withoutPlus.length > PHONE_MAX_DIGITS) {
    return null;
  }
  if (withoutPlus.startsWith("0")) return null;
  return withoutPlus;
}

// netlify/lib/config.ts
var XPOSEDORNOT_BASE = "https://api.xposedornot.com";
var LEAKCHECK_PUBLIC_BASE = "https://leakcheck.io/api/public";
var PROVIDERS = {
  xposedornot: {
    id: "xposedornot",
    displayName: "XposedOrNot",
    homepage: "https://xposedornot.com",
    documentation: "https://xposedornot.com/api_doc",
    lookups: ["email"],
    coverage: "Open breach index covering thousands of publicly disclosed breaches. Free email endpoint, no key required.",
    timeoutMs: 6500,
    minIntervalMs: 500,
    quota: "2 requests/s, 25/hour, 100/day per IP",
    apiKeyEnvVar: null,
    endpoints: {
      // `details=true` returns breach names *and* their metadata in a single
      // call, which halves the quota consumed per lookup.
      checkEmail: (email) => `${XPOSEDORNOT_BASE}/v1/check-email/${encodeURIComponent(email)}?details=true`,
      breachIndex: `${XPOSEDORNOT_BASE}/v1/breaches`
    },
    setupNote: "Works without credentials. Anonymous requests are rate limited by the provider.",
    terms: "https://xposedornot.com/privacy"
  },
  leakcheck: {
    id: "leakcheck",
    displayName: "LeakCheck",
    homepage: "https://leakcheck.io",
    documentation: "https://docs.leakcheck.io/public-api/lookup",
    lookups: ["email", "username", "phone"],
    coverage: "Public API over 10B+ leaked records. Answers email, username and phone lookups, and reports the breach sources and the categories of exposed data \u2014 never the data itself.",
    timeoutMs: 5e3,
    minIntervalMs: 1e3,
    quota: "1 request/s (public tier)",
    apiKeyEnvVar: null,
    endpoints: {
      checkEmail: (email) => `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(email)}`,
      checkUsername: (username) => `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(username)}`,
      // The public tier resolves a phone number only when it is sent as bare
      // E.164 digits with `type=phone`; with a leading `+` it answers
      // "Could not determine search type automatically" (verified 2026-11-08).
      checkPhone: (digits) => `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(digits)}&type=phone`
    },
    setupNote: "Works without credentials. The public tier is free, including commercial use, and requires a \u201CPowered by LeakCheck\u201D link.",
    terms: "https://leakcheck.io/terms"
  }
};
var EMAIL_PROVIDER_IDS = ["xposedornot", "leakcheck"];
var USERNAME_PROVIDER_IDS = ["leakcheck"];
var PHONE_PROVIDER_IDS = ["leakcheck"];
var STATS = {
  cacheSeconds: 6 * 60 * 60,
  timeoutMs: 6e3,
  source: "XposedOrNot public breach index",
  sourceUrl: "https://xposedornot.com/"
};
var RATE_LIMITS = {
  checkEmail: { limit: 8, windowSeconds: 60 },
  checkUsername: { limit: 8, windowSeconds: 60 },
  checkPhone: { limit: 8, windowSeconds: 60 },
  passwordRange: { limit: 60, windowSeconds: 60 },
  providers: { limit: 60, windowSeconds: 60 },
  breachStats: { limit: 30, windowSeconds: 60 }
};
var LIMITS = {
  maxBodyBytes: 4096,
  /** Largest provider body we are willing to buffer and parse. */
  maxResponseBytes: 4e6,
  /** Overall server-side budget for one lookup (Netlify caps at 10s). */
  lookupDeadlineMs: 9e3,
  userAgent: "i-have-been-leaked/1.0 (+https://github.com/codahhh/i-have-been-leaked)"
};
function isProviderConfigured(definition) {
  if (!definition.apiKeyEnvVar) return true;
  const value = readEnv(definition.apiKeyEnvVar);
  return typeof value === "string" && value.trim().length > 0;
}
function readEnv(name) {
  const value = typeof process !== "undefined" ? process.env?.[name] : void 0;
  return typeof value === "string" && value.length > 0 ? value : void 0;
}

// netlify/lib/log.ts
var EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
var LONG_DIGITS = /\b\d{6,}\b/g;
var HEX_LIKE = /\b[0-9A-Fa-f]{32,}\b/g;
function scrub(text) {
  return text.replace(EMAIL_PATTERN, "[redacted-email]").replace(HEX_LIKE, "[redacted-hash]").replace(LONG_DIGITS, "[redacted-number]").slice(0, 300);
}
var ALLOWED_META_KEYS = /* @__PURE__ */ new Set([
  "provider",
  "status",
  "code",
  "httpStatus",
  "durationMs",
  "route",
  "reason",
  "attempt",
  "configured",
  "count",
  "state"
]);
function safeLog(level, message, meta) {
  const safeMeta = {};
  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (!ALLOWED_META_KEYS.has(key)) continue;
      if (value === void 0) continue;
      safeMeta[key] = typeof value === "string" ? scrub(value) : value;
    }
  }
  const line = `[ihl] ${message}`;
  if (level === "error") console.error(line, safeMeta);
  else if (level === "warn") console.warn(line, safeMeta);
  else console.log(line, safeMeta);
}

// netlify/lib/http.ts
var DEFAULT_MAX_BYTES = 4e6;
var DEFAULT_JSON_HEADERS = {
  Accept: "application/json",
  "User-Agent": "i-have-been-leaked/1.0"
};
async function fetchWithTimeout(url, options) {
  const startedAt = Date.now();
  const remainingFromDeadline = typeof options.deadline === "number" ? options.deadline - startedAt : Infinity;
  const timeoutMs = Math.max(250, Math.min(options.timeoutMs, remainingFromDeadline));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...DEFAULT_JSON_HEADERS,
        ...options.body ? { "Content-Type": "application/json" } : {},
        ...options.headers
      },
      body: options.body,
      signal: controller.signal,
      // Never let a CDN or undici cache a personal lookup result.
      cache: "no-store",
      redirect: "follow"
    });
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > (options.maxBytes ?? DEFAULT_MAX_BYTES)) {
      return {
        kind: "network_error",
        detail: "Provider response exceeded the size limit.",
        durationMs: Date.now() - startedAt
      };
    }
    const body = await response.text();
    if (body.length > (options.maxBytes ?? DEFAULT_MAX_BYTES)) {
      return {
        kind: "network_error",
        detail: "Provider response exceeded the size limit.",
        durationMs: Date.now() - startedAt
      };
    }
    return {
      kind: "response",
      status: response.status,
      headers: response.headers,
      body,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const name = typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
    if (name === "AbortError" || name === "TimeoutError") {
      return { kind: "timeout", durationMs };
    }
    return {
      kind: "network_error",
      detail: error instanceof Error ? error.message : "network failure",
      durationMs
    };
  } finally {
    clearTimeout(timer);
  }
}
function parseRetryAfter(headers) {
  const raw = headers.get("retry-after");
  if (!raw) return null;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber >= 0) return Math.ceil(asNumber);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1e3));
  }
  return null;
}
function safeJsonParse(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
function asRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function pickString(record, keys) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}
function pickNumber(record, keys) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  }
  return null;
}
function splitList(value) {
  if (!value) return [];
  return uniqueStrings(
    value.split(/[;,|]/).map((part) => part.trim()).filter((part) => part.length > 0 && part.length <= 64)
  );
}
function toStringList(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.filter((item) => typeof item === "string").map((s) => s.trim())
    );
  }
  if (typeof value === "string") return splitList(value);
  return [];
}
function uniqueStrings(values) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

// netlify/lib/normalize.ts
var MAX_NAME_LENGTH = 120;
var MAX_DESCRIPTION_LENGTH = 900;
function slug(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function cleanName(raw) {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  return trimmed.length > MAX_NAME_LENGTH ? `${trimmed.slice(0, MAX_NAME_LENGTH - 1)}\u2026` : trimmed;
}
function cleanDomain(raw) {
  if (!raw) return null;
  let candidate = raw.trim().toLowerCase();
  candidate = candidate.replace(/^https?:\/\//, "").replace(/^www\./, "");
  candidate = candidate.split("/")[0].split("?")[0];
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(candidate)) return null;
  return candidate.slice(0, 120);
}
function cleanDate(raw) {
  if (!raw) return null;
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (iso) {
    const [, year, month, day] = iso;
    if (Number(month) >= 1 && Number(month) <= 12) {
      return day ? `${year}-${month}-${day}` : `${year}-${month}`;
    }
  }
  const yearOnly = value.match(/^(\d{4})$/);
  if (yearOnly) return yearOnly[1];
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    const year = date.getUTCFullYear();
    if (year > 1990 && year <= (/* @__PURE__ */ new Date()).getUTCFullYear() + 1) {
      return date.toISOString().slice(0, 10);
    }
  }
  return null;
}
function cleanExposedData(values) {
  return uniqueStrings(
    values.map((value) => value.replace(/\s+/g, " ").trim()).filter((value) => value.length > 0 && value.length <= 60)
  ).slice(0, 24);
}
function cleanDescription(raw) {
  if (!raw) return null;
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return null;
  return collapsed.length > MAX_DESCRIPTION_LENGTH ? `${collapsed.slice(0, MAX_DESCRIPTION_LENGTH - 1)}\u2026` : collapsed;
}
function breachId(name, domain) {
  return `b_${slug(domain ?? name)}`;
}
function toBreach(draft, source) {
  const name = cleanName(draft.name);
  const domain = cleanDomain(draft.domain ?? null);
  return {
    id: breachId(name, domain),
    name,
    domain,
    breachDate: cleanDate(draft.breachDate ?? null),
    exposedData: cleanExposedData(draft.exposedData ?? []),
    source,
    sources: [source],
    description: cleanDescription(draft.description ?? null),
    pwnCount: typeof draft.pwnCount === "number" && Number.isFinite(draft.pwnCount) && draft.pwnCount > 0 ? Math.round(draft.pwnCount) : null
  };
}

// netlify/lib/merge.ts
function datePrecision(date) {
  if (!date) return 0;
  return date.split("-").length;
}
function mergeInto(target, incoming) {
  for (const source of incoming.sources) {
    if (!target.sources.includes(source)) target.sources.push(source);
  }
  if (!target.domain && incoming.domain) target.domain = incoming.domain;
  if (datePrecision(incoming.breachDate) > datePrecision(target.breachDate)) {
    target.breachDate = incoming.breachDate;
  }
  for (const item of incoming.exposedData) {
    if (!target.exposedData.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      target.exposedData.push(item);
    }
  }
  if (incoming.description && (!target.description || incoming.description.length > target.description.length)) {
    target.description = incoming.description;
  }
  if (incoming.pwnCount && (!target.pwnCount || incoming.pwnCount > target.pwnCount)) {
    target.pwnCount = incoming.pwnCount;
  }
}
function mergeBreaches(results) {
  const byName = /* @__PURE__ */ new Map();
  const byDomain = /* @__PURE__ */ new Map();
  const merged = [];
  for (const result of results) {
    for (const breach of result.breaches) {
      const nameKey = slug(breach.name);
      const domainKey = breach.domain ? slug(breach.domain) : null;
      const existing = (nameKey ? byName.get(nameKey) : void 0) ?? (domainKey ? byDomain.get(domainKey) : void 0);
      if (existing) {
        mergeInto(existing, breach);
        if (nameKey) byName.set(nameKey, existing);
        if (domainKey) byDomain.set(domainKey, existing);
        continue;
      }
      const copy = {
        ...breach,
        sources: [...breach.sources],
        exposedData: [...breach.exposedData]
      };
      merged.push(copy);
      if (nameKey) byName.set(nameKey, copy);
      if (domainKey) byDomain.set(domainKey, copy);
    }
  }
  return merged.sort((a, b) => {
    const aDate = a.breachDate ?? "";
    const bDate = b.breachDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return a.name.localeCompare(b.name);
  });
}

// netlify/lib/throttle.ts
var lastCallAt = /* @__PURE__ */ new Map();
function throttlingEnabled() {
  if (typeof process === "undefined") return true;
  return process.env?.VITEST !== "true" && process.env?.IHL_DISABLE_THROTTLE !== "1";
}
async function reserveProviderSlot(key, minIntervalMs, deadline) {
  if (!throttlingEnabled() || minIntervalMs <= 0) return { ok: true, waitedMs: 0 };
  const now = Date.now();
  const earliest = (lastCallAt.get(key) ?? 0) + minIntervalMs;
  const waitMs = Math.max(0, earliest - now);
  if (now + waitMs > deadline - 750) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1e3)) };
  }
  lastCallAt.set(key, now + waitMs);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return { ok: true, waitedMs: waitMs };
}

// netlify/lib/providers/leakcheck.ts
var DEFINITION = PROVIDERS.leakcheck;
var MAX_SOURCES = 400;
function extractSources(record) {
  const entries = record.sources;
  if (!Array.isArray(entries)) return [];
  const drafts = [];
  for (const entry of entries.slice(0, MAX_SOURCES)) {
    const source = asRecord(entry);
    if (!source) continue;
    const name = pickString(source, ["name", "breach", "title"]);
    if (!name) continue;
    drafts.push({
      name,
      // Source names are usually domains ("Aura.com") but not always
      // ("CDEK", "Regme"); `cleanDomain` keeps only the real ones.
      domain: pickString(source, ["domain", "name"]),
      breachDate: pickString(source, ["date", "breach_date", "breachDate"])
    });
  }
  return drafts;
}
function extractCategories(record) {
  return uniqueStrings(toStringList(record.fields ?? record.types ?? null)).slice(0, 24);
}
async function queryLeakCheck(value, kind, deadline) {
  const queriedAt = (/* @__PURE__ */ new Date()).toISOString();
  const base = {
    provider: "leakcheck",
    displayName: DEFINITION.displayName,
    queriedAt,
    breaches: [],
    exposedCategories: []
  };
  if (!isProviderConfigured(DEFINITION)) {
    return {
      ...base,
      status: "not_configured",
      responded: false,
      error: { code: "not_configured", detail: DEFINITION.setupNote, retryAfterSeconds: null },
      durationMs: 0
    };
  }
  const slot = await reserveProviderSlot(DEFINITION.id, DEFINITION.minIntervalMs, deadline);
  if (!slot.ok) {
    return {
      ...base,
      status: "rate_limited",
      responded: false,
      error: {
        code: "rate_limited",
        detail: "Outbound calls to this provider are currently spaced out.",
        retryAfterSeconds: slot.retryAfterSeconds
      },
      durationMs: 0
    };
  }
  const url = kind === "email" ? DEFINITION.endpoints.checkEmail?.(value) : kind === "username" ? DEFINITION.endpoints.checkUsername?.(value) : DEFINITION.endpoints.checkPhone?.(value);
  if (!url) {
    return {
      ...base,
      status: "not_configured",
      responded: false,
      error: { code: "not_configured", detail: "No endpoint configured.", retryAfterSeconds: null },
      durationMs: 0
    };
  }
  const outcome = await fetchWithTimeout(url, {
    timeoutMs: DEFINITION.timeoutMs,
    deadline
  });
  if (outcome.kind === "timeout") {
    return {
      ...base,
      status: "timeout",
      responded: false,
      error: {
        code: "timeout",
        detail: "Provider did not answer before the deadline.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.kind === "network_error") {
    return {
      ...base,
      status: "unavailable",
      responded: false,
      error: {
        code: "network_error",
        detail: "Could not reach the provider.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.status === 429) {
    return {
      ...base,
      status: "rate_limited",
      responded: false,
      error: {
        code: "rate_limited",
        detail: "Provider rate limit reached.",
        retryAfterSeconds: parseRetryAfter(outcome.headers)
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.status === 404 || outcome.status === 204) {
    return { ...base, status: "not_found", responded: true, error: null, durationMs: outcome.durationMs };
  }
  if (outcome.status < 200 || outcome.status >= 300) {
    return {
      ...base,
      status: "unavailable",
      responded: false,
      error: {
        code: "provider_error",
        detail: `Provider returned HTTP ${outcome.status}.`,
        retryAfterSeconds: parseRetryAfter(outcome.headers)
      },
      durationMs: outcome.durationMs
    };
  }
  const payload = safeJsonParse(outcome.body);
  const record = asRecord(payload);
  if (!record) {
    return {
      ...base,
      status: "invalid_response",
      responded: false,
      error: { code: "invalid_response", detail: "Response was not valid JSON.", retryAfterSeconds: null },
      durationMs: outcome.durationMs
    };
  }
  const success = record.success;
  if (success === false) {
    const message = pickString(record, ["error", "message"]) ?? "";
    if (/not\s*found/i.test(message)) {
      return { ...base, status: "not_found", responded: true, error: null, durationMs: outcome.durationMs };
    }
    return {
      ...base,
      status: "unavailable",
      responded: false,
      error: {
        code: "provider_error",
        detail: message ? `Provider reported: ${message.slice(0, 120)}` : "Provider refused the query.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  if (success !== true && !Array.isArray(record.sources) && typeof record.found !== "number") {
    return {
      ...base,
      status: "invalid_response",
      responded: false,
      error: {
        code: "invalid_response",
        detail: "Response did not match any known schema.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  const drafts = extractSources(record);
  const categories = extractCategories(record);
  const found = pickNumber(record, ["found", "count"]);
  if (drafts.length === 0) {
    if (found !== null && found > 0) {
      return {
        ...base,
        status: "invalid_response",
        responded: false,
        error: {
          code: "invalid_response",
          detail: "Provider reported matches without naming a source.",
          retryAfterSeconds: null
        },
        durationMs: outcome.durationMs
      };
    }
    return {
      ...base,
      status: "not_found",
      responded: true,
      exposedCategories: categories,
      error: null,
      durationMs: outcome.durationMs
    };
  }
  return {
    ...base,
    status: "ok",
    responded: true,
    breaches: drafts.map((draft) => toBreach(draft, "leakcheck")),
    exposedCategories: categories,
    error: null,
    durationMs: outcome.durationMs
  };
}

// netlify/lib/providers/xposedOrNot.ts
var DEFINITION2 = PROVIDERS.xposedornot;
var MAX_DETAILS = 400;
function extractBreachNames(payload) {
  const names = [];
  const collect = (entries) => {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (typeof entry === "string") {
        names.push(entry);
      } else if (Array.isArray(entry)) {
        for (const item of entry) if (typeof item === "string") names.push(item);
      } else {
        const object = asRecord(entry);
        const name = pickString(object, ["breach", "name", "title", "BreachName"]);
        if (name) names.push(name);
      }
    }
  };
  collect(payload.breaches);
  collect(payload.ExposedBreaches);
  return uniqueStrings(
    names.map((name) => name.trim()).filter((name) => name.length > 0 && name.length <= 120)
  );
}
function extractDetails(payload) {
  const entries = payload.breach_details;
  if (!Array.isArray(entries)) return [];
  const drafts = [];
  for (const entry of entries.slice(0, MAX_DETAILS)) {
    const record = asRecord(entry);
    if (!record) continue;
    const name = pickString(record, ["name", "breach", "title"]);
    if (!name) continue;
    const company = asRecord(record.company);
    const security = asRecord(record.security);
    drafts.push({
      name,
      domain: pickString(company, ["name", "domain"]) ?? pickString(record, ["domain", "website"]),
      breachDate: pickString(record, ["breach_date", "breachDate", "xposed_date", "date"]),
      exposedData: toStringList(record.exposed_data ?? record.exposedData ?? null),
      description: pickString(record, ["description", "details", "summary"]),
      pwnCount: pickNumber(record, ["records_exposed", "pwnCount", "exposedRecords"])
    });
    const risk = pickString(security, ["password_risk"]);
    const draft = drafts[drafts.length - 1];
    if (risk && risk !== "unknown" && draft) {
      draft.exposedData = uniqueStrings([...draft.exposedData ?? [], `Password risk: ${risk}`]);
    }
  }
  return drafts;
}
function isExplicitNotFound(payload) {
  const record = asRecord(payload);
  if (!record) return false;
  const error = pickString(record, ["Error", "error", "message"]);
  return error !== null && /not\s*found/i.test(error);
}
async function queryXposedOrNot(email, deadline) {
  const queriedAt = (/* @__PURE__ */ new Date()).toISOString();
  const base = {
    provider: "xposedornot",
    displayName: DEFINITION2.displayName,
    queriedAt,
    breaches: [],
    exposedCategories: []
  };
  if (!isProviderConfigured(DEFINITION2)) {
    return {
      ...base,
      status: "not_configured",
      responded: false,
      error: { code: "not_configured", detail: DEFINITION2.setupNote, retryAfterSeconds: null },
      durationMs: 0
    };
  }
  const slot = await reserveProviderSlot(DEFINITION2.id, DEFINITION2.minIntervalMs, deadline);
  if (!slot.ok) {
    return {
      ...base,
      status: "rate_limited",
      responded: false,
      error: {
        code: "rate_limited",
        detail: "Outbound calls to this provider are currently spaced out.",
        retryAfterSeconds: slot.retryAfterSeconds
      },
      durationMs: 0
    };
  }
  const url = DEFINITION2.endpoints.checkEmail?.(email);
  if (!url) {
    return {
      ...base,
      status: "not_configured",
      responded: false,
      error: { code: "not_configured", detail: "No endpoint configured.", retryAfterSeconds: null },
      durationMs: 0
    };
  }
  const outcome = await fetchWithTimeout(url, {
    timeoutMs: DEFINITION2.timeoutMs,
    deadline
  });
  if (outcome.kind === "timeout") {
    return {
      ...base,
      status: "timeout",
      responded: false,
      error: {
        code: "timeout",
        detail: "Provider did not answer before the deadline.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.kind === "network_error") {
    return {
      ...base,
      status: "unavailable",
      responded: false,
      error: {
        code: "network_error",
        detail: "Could not reach the provider.",
        retryAfterSeconds: null
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.status === 429) {
    return {
      ...base,
      status: "rate_limited",
      responded: false,
      error: {
        code: "rate_limited",
        detail: "Provider rate limit reached.",
        retryAfterSeconds: parseRetryAfter(outcome.headers)
      },
      durationMs: outcome.durationMs
    };
  }
  if (outcome.status === 404 || outcome.status === 204) {
    return { ...base, status: "not_found", responded: true, error: null, durationMs: outcome.durationMs };
  }
  if (outcome.status < 200 || outcome.status >= 300) {
    return {
      ...base,
      status: "unavailable",
      responded: false,
      error: {
        code: "provider_error",
        detail: `Provider returned HTTP ${outcome.status}.`,
        retryAfterSeconds: parseRetryAfter(outcome.headers)
      },
      durationMs: outcome.durationMs
    };
  }
  const payload = safeJsonParse(outcome.body);
  const record = asRecord(payload);
  if (!record) {
    return {
      ...base,
      status: "invalid_response",
      responded: false,
      error: { code: "invalid_response", detail: "Response was not valid JSON.", retryAfterSeconds: null },
      durationMs: outcome.durationMs
    };
  }
  if (isExplicitNotFound(payload)) {
    return { ...base, status: "not_found", responded: true, error: null, durationMs: outcome.durationMs };
  }
  const names = extractBreachNames(record);
  const details = extractDetails(record);
  if (names.length === 0 && details.length === 0) {
    const error = pickString(record, ["Error", "error", "message"]);
    if (error) {
      return {
        ...base,
        status: "unavailable",
        responded: false,
        error: {
          code: "provider_error",
          detail: `Provider reported: ${error.slice(0, 120)}`,
          retryAfterSeconds: null
        },
        durationMs: outcome.durationMs
      };
    }
    return { ...base, status: "not_found", responded: true, error: null, durationMs: outcome.durationMs };
  }
  const byName = new Map(details.map((draft) => [draft.name.toLowerCase(), draft]));
  const breaches = names.map(
    (name) => toBreach(byName.get(name.toLowerCase()) ?? { name }, "xposedornot")
  );
  const known = new Set(breaches.map((breach) => breach.name.toLowerCase()));
  for (const detail of details) {
    if (!known.has(detail.name.toLowerCase())) {
      breaches.push(toBreach(detail, "xposedornot"));
      known.add(detail.name.toLowerCase());
    }
  }
  return {
    ...base,
    status: "ok",
    responded: true,
    breaches,
    error: null,
    durationMs: outcome.durationMs
  };
}

// netlify/lib/rateLimit.ts
import { createHash, randomBytes } from "node:crypto";
var INSTANCE_SALT = randomBytes(16).toString("hex");
var buckets = /* @__PURE__ */ new Map();
var MAX_BUCKETS = 5e3;
function clientKey(request) {
  const forwarded = request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`${INSTANCE_SALT}:${ip}`).digest("hex").slice(0, 24);
}
function checkRateLimit(key, config) {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1e3;
  if (buckets.size > MAX_BUCKETS) sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.limit - 1, retryAfterSeconds: 0 };
  }
  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1e3))
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    retryAfterSeconds: 0
  };
}
function sweep(now) {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}

// netlify/lib/responses.ts
var JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  // Personal lookups must never be stored by a browser, proxy or CDN.
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer"
};
function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...JSON_HEADERS, ...init.headers }
  });
}
function apiError(status, error, headers = {}) {
  return json({ ok: false, error }, { status, headers });
}
function methodNotAllowed(allow) {
  return apiError(
    405,
    { code: "method_not_allowed", message: "Method not allowed." },
    { Allow: allow }
  );
}
function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (requestHost && originHost === requestHost) return true;
  const isLocal = (host) => host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host === "localhost";
  return isLocal(originHost) && (requestHost === "" || isLocal(requestHost));
}
async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > LIMITS.maxBodyBytes) {
    return {
      ok: false,
      response: apiError(413, { code: "invalid_request", message: "Payload too large." })
    };
  }
  let raw;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: apiError(400, { code: "invalid_request", message: "Unreadable body." })
    };
  }
  if (raw.length > LIMITS.maxBodyBytes) {
    return {
      ok: false,
      response: apiError(413, { code: "invalid_request", message: "Payload too large." })
    };
  }
  if (raw.trim().length === 0) {
    return {
      ok: false,
      response: apiError(400, { code: "invalid_request", message: "Empty body." })
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {
        ok: false,
        response: apiError(400, { code: "invalid_request", message: "Body must be an object." })
      };
    }
    return { ok: true, value: parsed };
  } catch {
    return {
      ok: false,
      response: apiError(400, { code: "invalid_request", message: "Invalid JSON." })
    };
  }
}

// netlify/lib/handlers/checkLookup.ts
var QUERIES = {
  // XposedOrNot only answers email lookups; the kind is re-checked by the caller.
  xposedornot: (value, _kind, deadline) => queryXposedOrNot(value, deadline),
  leakcheck: (value, kind, deadline) => queryLeakCheck(value, kind, deadline)
};
async function runProvider(id, value, kind, deadline) {
  try {
    return await QUERIES[id](value, kind, deadline);
  } catch (error) {
    safeLog("error", "provider adapter threw", {
      provider: id,
      code: error instanceof Error ? error.name : "unknown"
    });
    return {
      provider: id,
      displayName: PROVIDERS[id].displayName,
      status: "unavailable",
      responded: false,
      breaches: [],
      exposedCategories: [],
      error: { code: "unknown", detail: "Provider adapter failed.", retryAfterSeconds: null },
      queriedAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationMs: 0
    };
  }
}
function deriveState(breachCount, providers, totalProviders) {
  if (breachCount > 0) return "breached";
  const responded = providers.filter((provider) => provider.responded).length;
  if (responded === 0) return "error";
  if (responded < totalProviders) return "incomplete";
  return "clean";
}
var EMAIL_CONFIG = {
  kind: "email",
  providerIds: EMAIL_PROVIDER_IDS,
  rateLimit: RATE_LIMITS.checkEmail,
  route: "check-email"
};
var USERNAME_CONFIG = {
  kind: "username",
  providerIds: USERNAME_PROVIDER_IDS,
  rateLimit: RATE_LIMITS.checkUsername,
  route: "check-username"
};
var PHONE_CONFIG = {
  kind: "phone",
  providerIds: PHONE_PROVIDER_IDS,
  rateLimit: RATE_LIMITS.checkPhone,
  route: "check-phone"
};
async function runLookup(request, config) {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!isAllowedOrigin(request)) {
    return apiError(403, { code: "invalid_request", message: "Origin not allowed." });
  }
  const limit = checkRateLimit(`${config.route}:${clientKey(request)}`, config.rateLimit);
  if (!limit.allowed) {
    safeLog("warn", "rate limited", { route: config.route });
    return apiError(
      429,
      {
        code: "rate_limited",
        message: "Too many lookups. Please wait before trying again.",
        retryAfterSeconds: limit.retryAfterSeconds
      },
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const raw = config.kind === "email" ? body.value.email : config.kind === "username" ? body.value.username : body.value.phone;
  const consent = body.value.consent;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return apiError(400, { code: "invalid_request", message: "The value is missing." });
  }
  let value;
  if (config.kind === "email") {
    if (!isValidEmail(raw)) {
      return apiError(400, { code: "invalid_email", message: "The address is not valid." });
    }
    value = normalizeEmail(raw);
  } else if (config.kind === "username") {
    const trimmed = raw.trim();
    if (!isValidUsername(trimmed)) {
      return apiError(400, { code: "invalid_username", message: "The username is not valid." });
    }
    value = trimmed;
  } else {
    const digits = toPhoneDigits(raw);
    if (!digits) {
      return apiError(400, {
        code: "invalid_phone",
        message: "The phone number is not a valid E.164 number."
      });
    }
    value = digits;
  }
  if (consent !== true) {
    return apiError(400, {
      code: "consent_required",
      message: "Consent to query the external providers is required."
    });
  }
  const startedAt = Date.now();
  const deadline = startedAt + LIMITS.lookupDeadlineMs;
  const providers = await Promise.all(
    config.providerIds.map((id) => runProvider(id, value, config.kind, deadline))
  );
  const breaches = mergeBreaches(providers);
  const totalProviders = config.providerIds.length;
  const respondingProviders = providers.filter((provider) => provider.responded).length;
  const state = deriveState(breaches.length, providers, totalProviders);
  const response = {
    kind: config.kind,
    ok: state !== "error",
    state,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalBreaches: breaches.length,
    breaches,
    providers,
    respondingProviders,
    totalProviders,
    durationMs: Date.now() - startedAt
  };
  safeLog("info", "lookup completed", {
    route: config.route,
    state,
    count: breaches.length,
    durationMs: response.durationMs
  });
  return json(response);
}
function handleCheckEmail(request) {
  return runLookup(request, EMAIL_CONFIG);
}

// netlify/lib/webAdapter.ts
var MAX_BODY_BYTES = 8192;
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        chunks.push(chunk.subarray(0, Math.max(0, MAX_BODY_BYTES - (size - chunk.length))));
        req.destroy();
        resolve(Buffer.concat(chunks).toString("utf8"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => reject(new Error("unreadable body")));
  });
}
async function readWebRequest(req) {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const url = new URL(req.url ?? "/", `${proto}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === void 0) continue;
    if (Array.isArray(value)) for (const item of value) headers.append(key, item);
    else headers.set(key, value);
  }
  const method = (req.method ?? "GET").toUpperCase();
  const body = method === "GET" || method === "HEAD" ? "" : await readBody(req);
  return new Request(url, {
    method,
    headers,
    body: body.length > 0 ? body : void 0
  });
}
async function sendWebResponse(webResponse, res) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await webResponse.arrayBuffer()));
}

// vercel-entry.ts
async function handler(req, res) {
  const request = await readWebRequest(req);
  const response = await handleCheckEmail(request);
  await sendWebResponse(response, res);
}
export {
  handler as default
};
