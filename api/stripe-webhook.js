import crypto from "node:crypto";
import { handleOptions, paymentsEnabled, sendJson, stripeConfig, supabaseRequest } from "./_shared.js";

const MAX_SIGNATURE_AGE_SECONDS = 300;

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  return ageSeconds < MAX_SIGNATURE_AGE_SECONDS;
}

async function recordCertificate(session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId) return;

  const paidAt = new Date();
  const validUntil = new Date(paidAt);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  await supabaseRequest("certificates?on_conflict=stripe_session_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      user_id: userId,
      company_name: session.metadata?.company_name || null,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      amount_cents: session.amount_total,
      currency: session.currency,
      status: "active",
      paid_at: paidAt.toISOString(),
      valid_until: validUntil.toISOString()
    })
  });
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  if (!paymentsEnabled()) {
    return sendJson(res, 503, { ok: false, error: "Le paiement est desactive sur cet environnement." });
  }

  const { webhookSecret } = stripeConfig();
  if (!webhookSecret) return sendJson(res, 500, { ok: false, error: "Webhook Stripe non configuré." });

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return sendJson(res, 400, { ok: false, error: "Signature Stripe invalide." });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return sendJson(res, 400, { ok: false, error: "Payload Stripe illisible." });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await recordCertificate(event.data.object);
    } catch (error) {
      // Stripe retries the webhook on non-2xx, so surface the failure
      // instead of silently losing the payment -> certificate write.
      return sendJson(res, 500, { ok: false, error: `Enregistrement du certificat impossible : ${error.message}` });
    }
  }

  return sendJson(res, 200, { ok: true, received: true });
}
