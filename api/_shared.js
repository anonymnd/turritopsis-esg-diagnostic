const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

const memoryStore = new Map();

export function handleOptions(req, res) {
  if (req.method !== "OPTIONS") return false;
  res.writeHead(204, jsonHeaders);
  res.end();
  return true;
}

export function sendJson(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload));
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function aiConfig() {
  const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
  return {
    provider: process.env.AI_PROVIDER || (baseUrl.includes("ollama.com") ? "ollama" : "openai"),
    baseUrl,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    apiKey: process.env.AI_API_KEY || process.env.OLLAMA_API_KEY
  };
}

export function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function authRequired() {
  return process.env.AUTH_REQUIRED !== "false";
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || "";
}

export async function requireUser(req) {
  if (!authRequired()) {
    return { id: "test-user", email: "test@turritopsis.local", role: "test" };
  }

  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  const { url, key } = supabaseConfig();
  if (!url || !key) {
    const error = new Error("Authentication service is not configured.");
    error.status = 500;
    throw error;
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = new Error("Invalid or expired session.");
    error.status = 401;
    throw error;
  }

  return response.json();
}

export function memoryGet(companyId) {
  return memoryStore.get(companyId) || null;
}

export function memorySet(companyId, data) {
  memoryStore.set(companyId, data);
  return data;
}

export function stripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceCents: Number(process.env.DIAGNOSTIC_PRICE_CENTS || 0),
    currency: (process.env.DIAGNOSTIC_CURRENCY || "mad").toLowerCase(),
    successUrl: process.env.STRIPE_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CANCEL_URL
  };
}

export function paymentsEnabled() {
  return process.env.ENABLE_PAYMENTS === "true";
}

function flattenStripeParams(obj, prefix, params) {
  for (const [key, value] of Object.entries(obj)) {
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${paramKey}[${index}]`;
        if (item && typeof item === "object") flattenStripeParams(item, arrayKey, params);
        else params.append(arrayKey, item);
      });
    } else if (value && typeof value === "object") {
      flattenStripeParams(value, paramKey, params);
    } else if (value !== undefined && value !== null) {
      params.append(paramKey, value);
    }
  }
}

// Stripe's REST API takes classic form-encoded params (not JSON), including
// for nested objects like line_items[0][price_data][unit_amount]. Using
// fetch directly here (rather than the stripe npm SDK) keeps the backend's
// existing dependency-free style, same as the Supabase/AI calls above.
export async function stripeRequest(path, body) {
  const { secretKey } = stripeConfig();
  if (!secretKey) {
    const error = new Error("Stripe n'est pas configuré sur cet environnement.");
    error.status = 500;
    throw error;
  }

  const params = new URLSearchParams();
  flattenStripeParams(body, "", params);

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || "La requête Stripe a échoué.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : JSON.stringify(payload));
  }

  return payload;
}

// Shared by every endpoint that scopes data to a company (documents,
// dossiers, snapshot): confirms the caller is an actual company_users
// member, optionally restricted to specific roles, before any read/write
// proceeds. Returns null (not an error) when Supabase isn't configured, so
// callers fall through to their own dev/memory fallback instead of always
// denying -- and null when there genuinely is no membership row, which
// callers should treat as a hard 403.
export async function requireMembership(userId, companyId, allowRoles = null) {
  if (!companyId) return null;
  const { url, key } = supabaseConfig();
  if (!url || !key) return undefined; // Supabase not configured: caller decides fallback behavior.

  const rows = await supabaseRequest(
    `company_users?company_id=eq.${encodeURIComponent(companyId)}&user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`
  ).catch(() => null);
  const membership = rows?.[0] || null;
  if (!membership) return null;
  if (allowRoles && !allowRoles.includes(membership.role)) return null;
  return membership;
}

// Storage uses a distinct REST surface (/storage/v1) from the Postgres
// REST API (/rest/v1) that supabaseRequest talks to, and file bytes go in
// the body directly rather than as a JSON field -- kept separate rather
// than overloading supabaseRequest for this.
export async function supabaseStorageUpload(bucket, path, buffer, contentType) {
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new Error("Supabase n'est pas configuré.");

  const response = await fetch(
    `${url.replace(/\/$/, "")}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType || "application/octet-stream",
        "x-upsert": "true"
      },
      body: buffer
    }
  );

  if (!response.ok) throw new Error(await response.text());
  return path;
}

export async function supabaseStorageSignedUrl(bucket, path, expiresInSeconds = 3600) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;

  const response = await fetch(
    `${url.replace(/\/$/, "")}/storage/v1/object/sign/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds })
    }
  );

  if (!response.ok) return null;
  const payload = await response.json();
  return payload.signedURL ? `${url.replace(/\/$/, "")}/storage/v1${payload.signedURL}` : null;
}

export async function supabaseStorageDelete(bucket, path) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return;

  await fetch(`${url.replace(/\/$/, "")}/storage/v1/object/${bucket}/${path}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  }).catch(() => {});
}

// Best-effort and intentionally non-blocking: a failed audit write should
// never be the reason a real action (validating a dossier, saving a
// snapshot) fails for the user. Call this and don't await it in the
// request's critical path, or await it but ignore its rejection.
export async function logAudit(actorId, companyId, action, details = {}) {
  try {
    await supabaseRequest("audit_logs", {
      method: "POST",
      body: JSON.stringify({ actor_id: actorId || null, company_id: companyId || null, action, details })
    });
  } catch {
    // Swallowed on purpose -- see comment above.
  }
}

// In-memory sliding-window limiter. Vercel serverless functions are
// stateless between cold starts, so this only bounds abuse within a warm
// instance -- a real deployment under sustained load needs a shared store
// (Redis/Upstash) instead. Still meaningfully better than no limit at all
// for a single-instance/low-traffic MVP, and costs nothing extra to run.
const rateLimitStore = new Map();

export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - entry.count };
}
