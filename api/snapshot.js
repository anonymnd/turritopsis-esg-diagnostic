import { handleOptions, memoryGet, memorySet, readJson, requireUser, sendJson, supabaseConfig, supabaseRequest } from "./_shared.js";

async function resolveMembership(userId, companyId) {
  const rows = await supabaseRequest(
    `company_users?company_id=eq.${encodeURIComponent(companyId)}&user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`
  );
  return rows?.[0] || null;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  const requestedCompanyId = url.searchParams.get("company_id") || "demo-company";
  const { url: supabaseUrl, key: supabaseKey } = supabaseConfig();
  const supabaseReady = Boolean(supabaseUrl && supabaseKey);

  let companyId = requestedCompanyId;
  let role = "owner";

  // Membership is only enforceable once Supabase is actually configured --
  // without it there is no company_users table to check against, so this
  // falls through to the existing in-memory dev fallback below instead of
  // denying everything. When it *is* configured, a real user must be a
  // verified member of the company_id they're asking for: this is what
  // replaces the old "companyId always equals the caller's own uid" hack,
  // and is what makes more than one person sharing a company possible.
  if (user.role !== "test" && supabaseReady) {
    const membership = await resolveMembership(user.id, requestedCompanyId).catch(() => null);
    if (!membership) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
    role = membership.role;
  }

  if (req.method === "PUT" && role === "viewer") {
    return sendJson(res, 403, { ok: false, error: "Lecture seule pour ce rôle." });
  }

  let pendingData = null;

  try {
    if (req.method === "GET") {
      const rows = await supabaseRequest(`esg_snapshots?company_id=eq.${encodeURIComponent(companyId)}&select=data&limit=1`);
      return sendJson(res, 200, { ok: true, data: rows?.[0]?.data || memoryGet(companyId) || null });
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      pendingData = body.data || body;
      const payload = {
        company_id: companyId,
        data: pendingData,
        updated_at: new Date().toISOString()
      };

      const rows = await supabaseRequest("esg_snapshots?on_conflict=company_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload)
      });

      return sendJson(res, 200, { ok: true, data: rows?.[0]?.data || pendingData });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    if (req.method === "PUT") {
      memorySet(companyId, pendingData || {});
      return sendJson(res, 200, { ok: true, data: pendingData || {}, storage: "memory", warning: error.message });
    }

    return sendJson(res, 200, { ok: true, data: memoryGet(companyId), storage: "memory", warning: error.message });
  }
}
