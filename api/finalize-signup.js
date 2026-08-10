import { handleOptions, logAudit, readJson, sendJson, supabaseConfig } from "./_shared.js";

// Stamps a freshly self-signed-up user with role "pme" in app_metadata.
// app_metadata (unlike user_metadata) can only be written with the service
// role key -- never by the user's own client SDK -- so this is the one
// place a role gets assigned, and it can only ever assign "pme". Promoting
// someone to "reviewer" or "admin" is a manual, out-of-band operation done
// directly in Supabase by an operator, on purpose: there is no self-serve
// path to a privileged role anywhere in this app.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const { url, key } = supabaseConfig();
  if (!url || !key) return sendJson(res, 200, { ok: false, error: "Supabase n'est pas configuré." });

  const body = await readJson(req);
  const userId = body.userId;
  if (!userId) return sendJson(res, 400, { ok: false, error: "userId manquant." });

  try {
    const currentResponse = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    if (!currentResponse.ok) throw new Error(await currentResponse.text());

    const currentUser = await currentResponse.json();
    const currentMetadata = currentUser.app_metadata || {};
    if (currentMetadata.role) {
      return sendJson(res, 200, { ok: true, skipped: true });
    }

    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ app_metadata: { ...currentMetadata, role: "pme" } })
    });
    if (!response.ok) throw new Error(await response.text());
    logAudit(userId, null, "user.role.assigned", { role: "pme" });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    // Best-effort: if this fails the user just has no role yet, and the
    // frontend already treats a missing role as "pme" (least privilege),
    // so failure here degrades safely rather than granting anything.
    return sendJson(res, 200, { ok: false, error: error.message });
  }
}
