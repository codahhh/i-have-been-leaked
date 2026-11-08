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
var EMAIL_PROVIDER_IDS = ["xposedornot", "leakcheck"];
var USERNAME_PROVIDER_IDS = ["leakcheck"];
var PHONE_PROVIDER_IDS = [];
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
function isProviderConfigured(definition) {
  if (!definition.apiKeyEnvVar) return true;
  const value = readEnv(definition.apiKeyEnvVar);
  return typeof value === "string" && value.trim().length > 0;
}
function readEnv(name) {
  const value = typeof process !== "undefined" ? process.env?.[name] : void 0;
  return typeof value === "string" && value.length > 0 ? value : void 0;
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

// netlify/lib/handlers/providers.ts
function handleProviders(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed("GET");
  const limit = checkRateLimit(`providers:${clientKey(request)}`, RATE_LIMITS.providers);
  if (!limit.allowed) {
    return apiError(429, {
      code: "rate_limited",
      message: "Too many requests.",
      retryAfterSeconds: limit.retryAfterSeconds
    });
  }
  const providers = Object.values(PROVIDERS).map((definition) => ({
    id: definition.id,
    displayName: definition.displayName,
    coverage: definition.coverage,
    homepage: definition.homepage,
    lookups: definition.lookups,
    configured: isProviderConfigured(definition),
    activeForEmail: EMAIL_PROVIDER_IDS.includes(definition.id),
    activeForUsername: USERNAME_PROVIDER_IDS.includes(definition.id)
  }));
  const payload = {
    providers,
    emailProviders: EMAIL_PROVIDER_IDS.filter((id) => isProviderConfigured(PROVIDERS[id])),
    usernameProviders: USERNAME_PROVIDER_IDS.filter((id) => isProviderConfigured(PROVIDERS[id])),
    // No free source covers phone numbers: stated explicitly rather than faked.
    // See the README for the extension path.
    phoneProviders: [...PHONE_PROVIDER_IDS],
    passwordRangeAvailable: true
  };
  return json(payload, { headers: { "Cache-Control": "public, max-age=300" } });
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
  const response = await handleProviders(request);
  await sendWebResponse(response, res);
}
export {
  handler as default
};
