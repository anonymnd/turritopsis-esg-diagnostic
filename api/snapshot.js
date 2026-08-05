import { handleOptions, memoryGet, memorySet, readJson, requireUser, sendJson, supabaseRequest } from "./_shared.js";

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
  const companyId = user.role === "test" ? requestedCompanyId : user.id;
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
