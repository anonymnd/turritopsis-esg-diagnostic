import { handleOptions, readJson, requireUser, sendJson, supabaseRequest } from "./_shared.js";

async function findMembership(userId) {
  const rows = await supabaseRequest(
    `company_users?user_id=eq.${encodeURIComponent(userId)}&select=company_id,role&limit=1`
  );
  return rows?.[0] || null;
}

async function findCompany(companyId) {
  const rows = await supabaseRequest(`companies?id=eq.${encodeURIComponent(companyId)}&select=*&limit=1`);
  return rows?.[0] || null;
}

// GET returns the caller's company (or null -- a signed-in user with no
// company yet is a valid state, e.g. mid-onboarding). POST is idempotent:
// if the caller already belongs to one, it's returned as-is rather than
// creating a duplicate, so this same call safely covers both "just signed
// up" and "existing session that predates this feature".
export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  if (user.role === "test") {
    return sendJson(res, 200, { ok: true, company: { id: "demo-company", name: "Entreprise demo" }, role: "owner" });
  }

  try {
    if (req.method === "GET") {
      const membership = await findMembership(user.id);
      if (!membership) return sendJson(res, 200, { ok: true, company: null, role: null });
      const company = await findCompany(membership.company_id);
      return sendJson(res, 200, { ok: true, company, role: membership.role });
    }

    if (req.method === "POST") {
      const existing = await findMembership(user.id);
      if (existing) {
        const company = await findCompany(existing.company_id);
        return sendJson(res, 200, { ok: true, company, role: existing.role, created: false });
      }

      const body = await readJson(req);
      const companies = await supabaseRequest("companies", {
        method: "POST",
        body: JSON.stringify({
          name: String(body.name || "Entreprise").slice(0, 200),
          sector: body.sector || null,
          country: body.country || null,
          size: body.size || null,
          created_by: user.id
        })
      });
      const company = companies?.[0];
      if (!company) throw new Error("La création de l'entreprise a échoué.");

      await supabaseRequest("company_users", {
        method: "POST",
        body: JSON.stringify({ company_id: company.id, user_id: user.id, role: "owner" })
      });

      return sendJson(res, 200, { ok: true, company, role: "owner", created: true });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(res, 200, { ok: false, error: error.message, company: null, role: null });
  }
}
