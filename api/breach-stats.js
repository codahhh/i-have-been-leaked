/**
 * GENERATED FILE — do not edit.
 * Source: netlify/lib/handlers/* , bundled by scripts/build-vercel-api.mjs.
 * Regenerate with: npm run build:api
 */


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
    lookups: ["email", "username"],
    coverage: "Public API over 10B+ leaked records. Reports the breach sources and the categories of exposed data \u2014 never the data itself.",
    timeoutMs: 5e3,
    minIntervalMs: 1e3,
    quota: "1 request/s (public tier)",
    apiKeyEnvVar: null,
    endpoints: {
      checkEmail: (email) => `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(email)}`,
      checkUsername: (username) => `${LEAKCHECK_PUBLIC_BASE}?check=${encodeURIComponent(username)}`
    },
    setupNote: "Works without credentials. The public tier is free, including commercial use, and requires a \u201CPowered by LeakCheck\u201D link.",
    terms: "https://leakcheck.io/terms"
  }
};
var STATS = {
  cacheSeconds: 6 * 60 * 60,
  timeoutMs: 6e3,
  source: "XposedOrNot public breach index",
  sourceUrl: "https://xposedornot.com/"
};
var RATE_LIMITS = {
  checkEmail: { limit: 8, windowSeconds: 60 },
  checkUsername: { limit: 8, windowSeconds: 60 },
  passwordRange: { limit: 60, windowSeconds: 60 },
  providers: { limit: 60, windowSeconds: 60 },
  breachStats: { limit: 30, windowSeconds: 60 }
};

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

// netlify/lib/handlers/breachStats.ts
function buildUnavailable() {
  return {
    available: false,
    source: STATS.source,
    sourceUrl: STATS.sourceUrl,
    totalBreaches: 0,
    totalRecords: null,
    latestBreach: null,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function handleBreachStats(request) {
  if (request.method !== "GET") return methodNotAllowed("GET");
  const limit = checkRateLimit(`stats:${clientKey(request)}`, RATE_LIMITS.breachStats);
  if (!limit.allowed) {
    return apiError(429, {
      code: "rate_limited",
      message: "Too many requests.",
      retryAfterSeconds: limit.retryAfterSeconds
    });
  }
  const endpoint = PROVIDERS.xposedornot.endpoints.breachIndex;
  if (!endpoint) return json(buildUnavailable());
  const outcome = await fetchWithTimeout(endpoint, { timeoutMs: STATS.timeoutMs });
  if (outcome.kind !== "response" || outcome.status !== 200) {
    safeLog("warn", "breach stats unavailable", {
      provider: "xposedornot",
      code: outcome.kind === "response" ? `http_${outcome.status}` : outcome.kind
    });
    return json(buildUnavailable());
  }
  const payload = safeJsonParse(outcome.body);
  const record = asRecord(payload);
  const entries = Array.isArray(record?.exposedBreaches) ? record.exposedBreaches : Array.isArray(record?.breaches) ? record.breaches : null;
  if (!entries) {
    safeLog("warn", "breach stats unexpected payload", { provider: "xposedornot" });
    return json(buildUnavailable());
  }
  let totalRecords = 0;
  let recordsKnown = false;
  let latest = null;
  let latestDate = "";
  for (const raw of entries) {
    const entry = asRecord(raw);
    if (!entry) continue;
    const records = pickNumber(entry, ["exposedRecords", "xposed_records", "records", "pwnCount"]);
    if (typeof records === "number" && records > 0) {
      totalRecords += records;
      recordsKnown = true;
    }
    const date = pickString(entry, ["breachedDate", "xposedDate", "breachDate", "date"]);
    const name = pickString(entry, ["breachID", "breach", "name", "title"]);
    if (date && name && date > latestDate) {
      latestDate = date;
      latest = { name, date };
    }
  }
  const stats = {
    available: entries.length > 0,
    source: STATS.source,
    sourceUrl: STATS.sourceUrl,
    totalBreaches: entries.length,
    totalRecords: recordsKnown ? totalRecords : null,
    latestBreach: latest,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return json(stats, {
    headers: { "Cache-Control": `public, max-age=${STATS.cacheSeconds}` }
  });
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
  const response = await handleBreachStats(request);
  await sendWebResponse(response, res);
}
export {
  handler as default
};
