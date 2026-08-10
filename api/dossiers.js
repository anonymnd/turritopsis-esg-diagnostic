import {
  handleOptions,
  logAudit,
  readJson,
  requireMembership,
  requireRole,
  requireUser,
  sendJson,
  supabaseConfig,
  supabaseRequest
} from "./_shared.js";

const REVIEW_ROLES = ["reviewer", "admin"];

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const { url: supabaseUrl, key: supabaseKey } = supabaseConfig();
  const supabaseReady = Boolean(supabaseUrl && supabaseKey);
  if (!supabaseReady) {
    return sendJson(res, 200, { ok: false, error: "Supabase n'est pas configuré.", dossiers: [], dossier: null });
  }

  const dossierId = url.searchParams.get("id");
  const companyId = url.searchParams.get("company_id");
  const isReviewer = requireRole(user, REVIEW_ROLES);

  if (req.method === "GET") {
    if (dossierId) {
      const rows = await supabaseRequest(`dossiers?id=eq.${encodeURIComponent(dossierId)}&select=*,companies(name,sector)`).catch(() => null);
      const dossier = rows?.[0];
      if (!dossier) return sendJson(res, 404, { ok: false, error: "Dossier introuvable." });

      if (!isReviewer) {
        const membership = await requireMembership(user.id, dossier.company_id);
        if (!membership) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
      }
      return sendJson(res, 200, { ok: true, dossier });
    }

    if (companyId) {
      // A PME checking their own submission status, not the reviewer queue.
      if (!isReviewer) {
        const membership = await requireMembership(user.id, companyId);
        if (!membership) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
      }
      const rows = await supabaseRequest(
        `dossiers?company_id=eq.${encodeURIComponent(companyId)}&select=*&order=created_at.desc&limit=1`
      ).catch(() => null);
      return sendJson(res, 200, { ok: true, dossier: rows?.[0] || null });
    }

    if (!isReviewer) return sendJson(res, 403, { ok: false, error: "Réservé aux comptes reviewer." });

    const statusFilter = url.searchParams.get("status") || "submitted,in_review";
    const rows = await supabaseRequest(
      `dossiers?status=in.(${statusFilter})&select=*,companies(name,sector)&order=submitted_at.desc`
    ).catch(() => null);
    return sendJson(res, 200, { ok: true, dossiers: rows || [] });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    const targetCompanyId = body.companyId;
    if (!targetCompanyId) return sendJson(res, 400, { ok: false, error: "companyId manquant." });

    const membership = await requireMembership(user.id, targetCompanyId, ["owner", "collaborator"]);
    if (!membership) return sendJson(res, 403, { ok: false, error: "Lecture seule ou accès refusé pour ce dossier." });

    try {
      const snapshotRows = await supabaseRequest(`esg_snapshots?company_id=eq.${encodeURIComponent(targetCompanyId)}&select=data&limit=1`);
      const snapshot = snapshotRows?.[0]?.data || null;

      // Re-submitting reuses the existing dossier unless it's already been
      // signed off -- a validated dossier is a closed record, a fresh
      // submission after that starts a new one rather than overwriting it.
      const existingRows = await supabaseRequest(
        `dossiers?company_id=eq.${encodeURIComponent(targetCompanyId)}&status=neq.validated&select=id&order=created_at.desc&limit=1`
      );
      const existingId = existingRows?.[0]?.id;

      const payload = {
        company_id: targetCompanyId,
        status: "submitted",
        declared_score: body.declaredScore ?? null,
        reviewed_score: body.reviewedScore ?? null,
        snapshot,
        submitted_by: user.id === "test-user" ? null : user.id,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const rows = existingId
        ? await supabaseRequest(`dossiers?id=eq.${encodeURIComponent(existingId)}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await supabaseRequest("dossiers", { method: "POST", body: JSON.stringify(payload) });

      const dossier = rows?.[0];
      logAudit(user.id, targetCompanyId, "dossier.submit", { dossierId: dossier?.id });
      return sendJson(res, 200, { ok: true, dossier });
    } catch (error) {
      return sendJson(res, 200, { ok: false, error: error.message });
    }
  }

  if (req.method === "PUT") {
    if (!dossierId) return sendJson(res, 400, { ok: false, error: "id manquant." });
    if (!isReviewer) return sendJson(res, 403, { ok: false, error: "Réservé aux comptes reviewer." });

    const body = await readJson(req);
    const allowedStatus = ["in_review", "validated", "rejected"];
    const update = { updated_at: new Date().toISOString() };
    if (body.status) {
      if (!allowedStatus.includes(body.status)) return sendJson(res, 400, { ok: false, error: "Statut invalide." });
      update.status = body.status;
    }
    if (body.finalScore !== undefined) update.final_score = body.finalScore;
    if (body.status === "validated" || body.status === "in_review") {
      update.reviewer_id = user.id === "test-user" ? null : user.id;
      update.reviewed_at = new Date().toISOString();
    }

    try {
      const rows = await supabaseRequest(`dossiers?id=eq.${encodeURIComponent(dossierId)}`, {
        method: "PATCH",
        body: JSON.stringify(update)
      });
      const dossier = rows?.[0];
      if (!dossier) return sendJson(res, 404, { ok: false, error: "Dossier introuvable." });
      logAudit(user.id, dossier.company_id, `dossier.${body.status || "update"}`, { dossierId, finalScore: body.finalScore });
      return sendJson(res, 200, { ok: true, dossier });
    } catch (error) {
      return sendJson(res, 200, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed" });
}
