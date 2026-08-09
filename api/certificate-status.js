import { handleOptions, requireUser, sendJson, supabaseRequest } from "./_shared.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  try {
    const rows = await supabaseRequest(
      `certificates?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&order=valid_until.desc&limit=1`
    );
    const certificate = rows?.[0] || null;
    const active = Boolean(certificate && new Date(certificate.valid_until) > new Date());
    return sendJson(res, 200, { ok: true, active, certificate: active ? certificate : null });
  } catch (error) {
    // Supabase not reachable/configured: fail closed on "active" (no free
    // ride) but don't hard-crash the dashboard over it.
    return sendJson(res, 200, { ok: true, active: false, certificate: null, warning: error.message });
  }
}
