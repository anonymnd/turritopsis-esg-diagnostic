import {
  handleOptions,
  logAudit,
  memoryGet,
  memorySet,
  readJson,
  requireMembership,
  requireUser,
  sendJson,
  supabaseConfig,
  supabaseRequest,
  supabaseStorageDelete,
  supabaseStorageSignedUrl,
  supabaseStorageUpload
} from "./_shared.js";

const BUCKET = "proofs";
const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel Node functions cap request bodies around 4.5MB; leave headroom for base64/JSON overhead.

function safeFileName(name = "fichier") {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-120);
}

function memoryKey(companyId) {
  return `documents:${companyId}`;
}

function memoryList(companyId) {
  return memoryGet(memoryKey(companyId)) || [];
}

async function attachSignedUrls(documents) {
  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      url: document.file_path ? await supabaseStorageSignedUrl(BUCKET, document.file_path) : null
    }))
  );
}

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

  if (req.method === "GET") {
    const companyId = url.searchParams.get("company_id");
    if (!companyId) return sendJson(res, 400, { ok: false, error: "company_id manquant." });

    if (user.role !== "test" && supabaseReady) {
      const membership = await requireMembership(user.id, companyId);
      if (membership === null) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
    }

    if (!supabaseReady) {
      return sendJson(res, 200, { ok: true, documents: memoryList(companyId), storage: "memory" });
    }

    try {
      const rows = await supabaseRequest(
        `documents?company_id=eq.${encodeURIComponent(companyId)}&select=*&order=created_at.desc`
      );
      return sendJson(res, 200, { ok: true, documents: rows ? await attachSignedUrls(rows) : [] });
    } catch (error) {
      return sendJson(res, 200, { ok: true, documents: memoryList(companyId), storage: "memory", warning: error.message });
    }
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    const companyId = body.companyId;
    if (!companyId) return sendJson(res, 400, { ok: false, error: "companyId manquant." });

    if (user.role !== "test" && supabaseReady) {
      const membership = await requireMembership(user.id, companyId, ["owner", "collaborator"]);
      if (membership === null) return sendJson(res, 403, { ok: false, error: "Lecture seule ou accès refusé pour ce dossier." });
    }

    if (body.fileBase64 && Buffer.byteLength(body.fileBase64, "base64") > MAX_FILE_BYTES) {
      return sendJson(res, 400, { ok: false, error: "Fichier trop volumineux (4 Mo maximum)." });
    }

    const baseDocument = {
      id: `doc-${Date.now()}`,
      company_id: companyId,
      uploaded_by: user.id === "test-user" ? null : user.id,
      title: String(body.title || "Document sans titre").slice(0, 200),
      type: body.type || "Document",
      content: body.content || null,
      question_codes: body.questionCodes || [],
      file_path: null,
      file_type: body.fileType || null,
      file_size: null,
      created_at: new Date().toISOString()
    };

    if (!supabaseReady) {
      const document = { ...baseDocument, url: null };
      memorySet(memoryKey(companyId), [document, ...memoryList(companyId)]);
      return sendJson(res, 200, { ok: true, document, storage: "memory" });
    }

    let filePath = null;
    if (body.fileBase64) {
      const buffer = Buffer.from(body.fileBase64, "base64");
      const fileName = safeFileName(body.fileName || "document");
      filePath = `${companyId}/${Date.now()}-${fileName}`;
      try {
        await supabaseStorageUpload(BUCKET, filePath, buffer, body.fileType);
      } catch (error) {
        // Storage is best-effort: keep the document (with its extracted
        // text) even if the "proofs" bucket doesn't exist yet, rather than
        // failing the whole upload over a setup step that's separate from
        // the schema migration.
        filePath = null;
      }
    }

    try {
      const rows = await supabaseRequest("documents", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          uploaded_by: baseDocument.uploaded_by,
          title: baseDocument.title,
          type: baseDocument.type,
          content: baseDocument.content,
          question_codes: baseDocument.question_codes,
          file_path: filePath,
          file_type: baseDocument.file_type,
          file_size: body.fileBase64 ? Buffer.byteLength(body.fileBase64, "base64") : null
        })
      });
      const [document] = rows ? await attachSignedUrls(rows) : [];
      if (!document) throw new Error("Insertion sans réponse.");
      logAudit(user.id, companyId, "document.upload", { title: baseDocument.title, hasFile: Boolean(filePath) });
      return sendJson(res, 200, { ok: true, document });
    } catch (error) {
      if (filePath) await supabaseStorageDelete(BUCKET, filePath);
      const document = { ...baseDocument, url: null };
      memorySet(memoryKey(companyId), [document, ...memoryList(companyId)]);
      return sendJson(res, 200, { ok: true, document, storage: "memory", warning: error.message });
    }
  }

  if (req.method === "DELETE") {
    const documentId = url.searchParams.get("id");
    const companyId = url.searchParams.get("company_id");
    if (!documentId || !companyId) return sendJson(res, 400, { ok: false, error: "Paramètres manquants." });

    if (user.role !== "test" && supabaseReady) {
      const membership = await requireMembership(user.id, companyId, ["owner", "collaborator"]);
      if (membership === null) return sendJson(res, 403, { ok: false, error: "Accès refusé à ce dossier." });
    }

    if (!supabaseReady) {
      memorySet(memoryKey(companyId), memoryList(companyId).filter((document) => document.id !== documentId));
      return sendJson(res, 200, { ok: true, storage: "memory" });
    }

    try {
      const rows = await supabaseRequest(`documents?id=eq.${encodeURIComponent(documentId)}&company_id=eq.${encodeURIComponent(companyId)}&select=file_path`);
      const document = rows?.[0];
      if (!document) return sendJson(res, 404, { ok: false, error: "Document introuvable." });

      await supabaseRequest(`documents?id=eq.${encodeURIComponent(documentId)}`, { method: "DELETE" });
      if (document.file_path) await supabaseStorageDelete(BUCKET, document.file_path);
      logAudit(user.id, companyId, "document.delete", { documentId });
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      return sendJson(res, 200, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed" });
}
