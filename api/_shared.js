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
