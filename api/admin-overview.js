import { handleOptions, requireRole, requireUser, sendJson, supabaseConfig, supabaseRequest } from "./_shared.js";

// Intentionally read-only and intentionally narrow: companies + dossiers +
// a recent audit trail, not a full CRUD admin panel (editing questionnaire
// criteria, managing reviewer accounts etc. all still happen outside the
// app, same as role promotion does). This is oversight, not configuration.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  if (!requireRole(user, ["admin"])) {
    return sendJson(res, 403, { ok: false, error: "Réservé aux comptes admin." });
  }

  const { url, key } = supabaseConfig();
  if (!url || !key) {
    return sendJson(res, 200, { ok: false, error: "Supabase n'est pas configuré.", companies: [], dossiers: [], auditLogs: [] });
  }

  try {
    const [companies, dossiers, auditLogs] = await Promise.all([
      supabaseRequest("companies?select=*&order=created_at.desc"),
      supabaseRequest("dossiers?select=*,companies(name)&order=updated_at.desc&limit=100"),
      supabaseRequest("audit_logs?select=*&order=created_at.desc&limit=50")
    ]);
    return sendJson(res, 200, {
      ok: true,
      companies: companies || [],
      dossiers: dossiers || [],
      auditLogs: auditLogs || []
    });
  } catch (error) {
    return sendJson(res, 200, { ok: false, error: error.message, companies: [], dossiers: [], auditLogs: [] });
  }
}
