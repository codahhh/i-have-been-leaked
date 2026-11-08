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
var PWNED_PASSWORDS = {
  rangeUrl: (prefix) => `https://api.pwnedpasswords.com/range/${encodeURIComponent(prefix)}`,
  timeoutMs: 5e3,
  /** Prefix responses are non-identifying and cached briefly for resilience. */
  cacheSeconds: 3600,
  homepage: "https://haveibeenpwned.com/Passwords",
  terms: "https://haveibeenpwned.com/API/v3#License"
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

// src/utils/validation.ts
function isValidSha1Prefix(prefix) {
  return /^[0-9A-Fa-f]{5}$/.test(prefix);
}

// netlify/lib/handlers/passwordRange.ts
async function handlePasswordRange(request) {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!isAllowedOrigin(request)) {
    return apiError(403, { code: "invalid_request", message: "Origin not allowed." });
  }
  const limit = checkRateLimit(`pw:${clientKey(request)}`, RATE_LIMITS.passwordRange);
  if (!limit.allowed) {
    return apiError(
      429,
      { code: "rate_limited", message: "Too many requests.", retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }
  const prefix = (new URL(request.url).searchParams.get("prefix") ?? "").toUpperCase();
  if (!isValidSha1Prefix(prefix)) {
    return apiError(400, { code: "invalid_prefix", message: "A 5-character hex prefix is required." });
  }
  const outcome = await fetchWithTimeout(PWNED_PASSWORDS.rangeUrl(prefix), {
    timeoutMs: PWNED_PASSWORDS.timeoutMs,
    headers: {
      // Padding rows with count 0 defeat traffic-size analysis.
      "Add-Padding": "true",
      Accept: "text/plain"
    }
  });
  if (outcome.kind === "timeout") {
    safeLog("warn", "password range timeout", { provider: "hibp", code: "timeout" });
    return apiError(504, { code: "internal_error", message: "Upstream timeout." });
  }
  if (outcome.kind === "network_error") {
    safeLog("warn", "password range unreachable", { provider: "hibp", code: "network_error" });
    return apiError(502, { code: "internal_error", message: "Upstream unreachable." });
  }
  if (outcome.status === 429) {
    return apiError(
      429,
      { code: "rate_limited", message: "Upstream rate limit reached.", retryAfterSeconds: 60 },
      { "Retry-After": "60" }
    );
  }
  if (outcome.status !== 200) {
    safeLog("warn", "password range http error", {
      provider: "hibp",
      httpStatus: outcome.status,
      code: "provider_error"
    });
    return apiError(502, { code: "internal_error", message: "Upstream error." });
  }
  const suffixes = {};
  for (const line of outcome.body.split("\n")) {
    const match = line.trim().match(/^([0-9A-Fa-f]{35}):(\d+)$/);
    if (!match) continue;
    const count = Number(match[2]);
    if (count > 0) suffixes[match[1].toUpperCase()] = count;
  }
  if (Object.keys(suffixes).length === 0) {
    return apiError(502, { code: "internal_error", message: "Unusable upstream payload." });
  }
  const payload = { prefix, suffixes };
  return json(payload, {
    // Non-identifying, non-personal: safe to cache briefly to reduce upstream load.
    headers: {
      "Cache-Control": `public, max-age=${PWNED_PASSWORDS.cacheSeconds}`
    }
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
  const response = await handlePasswordRange(request);
  await sendWebResponse(response, res);
}
export {
  handler as default
};
