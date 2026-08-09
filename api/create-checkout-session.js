import { handleOptions, readJson, requireUser, sendJson, stripeConfig, stripeRequest } from "./_shared.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  const { priceCents, currency, successUrl, cancelUrl } = stripeConfig();
  if (!priceCents || !successUrl || !cancelUrl) {
    return sendJson(res, 500, { ok: false, error: "Le paiement n'est pas encore configuré sur cet environnement." });
  }

  const body = await readJson(req);
  const companyName = String(body.companyName || "Diagnostic ESG").slice(0, 120);

  try {
    const session = await stripeRequest("checkout/sessions", {
      mode: "payment",
      success_url: `${successUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}?checkout=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: {
              name: `Diagnostic ESG - ${companyName}`,
              description: "Score revu par IA, revue de preuves et certificat valable 12 mois."
            }
          }
        }
      ],
      metadata: { user_id: user.id, company_name: companyName }
    });
    return sendJson(res, 200, { ok: true, url: session.url });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }
}
