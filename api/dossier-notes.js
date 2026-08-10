import {
  getUserEmail,
  handleOptions,
  logAudit,
  readJson,
  requireMembership,
  requireRole,
  requireUser,
  sendEmail,
  sendJson,
  supabaseConfig,
  supabaseRequest
} from "./_shared.js";

const REVIEW_ROLES = ["reviewer", "admin"];

async function loadDossier(dossierId) {
  const rows = await supabaseRequest(`dossiers?id=eq.${encodeURIComponent(dossierId)}&select=id,company_id,submitted_by`);
  return rows?.[0] || null;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  const { url: supabaseUrl, key: supabaseKey } = supabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return sendJson(res, 200, { ok: false, error: "Supabase n'est pas configuré.", notes: [] });
  }

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const isReviewer = requireRole(user, REVIEW_ROLES);

  if (req.method === "GET") {
    const dossierId = url.searchParams.get("dossier_id");
    if (!dossierId) return sendJson(res, 400, { ok: false, error: "dossier_id manquant." });

    const dossier = await loadDossier(dossierId);
    if (!dossier) return sendJson(res, 404, { ok: false, error: "Dossier introuvable." });

    if (!isReviewer) {
      const membership = await requireMembership(user.id, dossier.company_id);
      if (!membership) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
    }

    const notes = await supabaseRequest(`dossier_notes?dossier_id=eq.${encodeURIComponent(dossierId)}&select=*&order=created_at.asc`).catch(() => []);
    return sendJson(res, 200, { ok: true, notes: notes || [] });
  }

  if (req.method === "POST") {
    // Notes are how a reviewer asks for more proof or explains a decision
    // back to the PME -- deliberately reviewer/admin-only. A PME responds
    // by editing their answer/evidence directly (the existing mechanism),
    // not by posting into this same thread.
    if (!isReviewer) return sendJson(res, 403, { ok: false, error: "Réservé aux comptes reviewer." });

    const body = await readJson(req);
    if (!body.dossierId || !body.note?.trim()) return sendJson(res, 400, { ok: false, error: "dossierId et note requis." });

    const dossier = await loadDossier(body.dossierId);
    if (!dossier) return sendJson(res, 404, { ok: false, error: "Dossier introuvable." });

    try {
      const rows = await supabaseRequest("dossier_notes", {
        method: "POST",
        body: JSON.stringify({
          dossier_id: body.dossierId,
          author_id: user.id === "test-user" ? null : user.id,
          question_code: body.questionCode || null,
          note: String(body.note).slice(0, 2000)
        })
      });
      logAudit(user.id, dossier.company_id, "dossier.note", { dossierId: body.dossierId, questionCode: body.questionCode });
      if (dossier.submitted_by) {
        getUserEmail(dossier.submitted_by).then((email) => {
          if (email) sendEmail(email, "Nouveau commentaire du reviewer", `<p>${String(body.note).slice(0, 500)}</p>`);
        });
      }
      return sendJson(res, 200, { ok: true, note: rows?.[0] });
    } catch (error) {
      return sendJson(res, 200, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed" });
}
