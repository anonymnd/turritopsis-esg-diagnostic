import http from "node:http";

const PORT = Number(process.env.PORT || process.env.ESG_API_PORT || 3001);
const AI_API_BASE_URL = (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const memorySnapshots = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

function normalizeScore(score) {
  const value = String(score || "").trim();
  if (["0", "0.5", "1", "NA"].includes(value)) return value;
  if (value.toLowerCase().includes("na")) return "NA";
  const numeric = Number(value);
  if (numeric >= 0.75) return "1";
  if (numeric >= 0.25) return "0.5";
  return "0";
}

function normalizeReview(payload, fallbackEvidence) {
  const suggestedScore = normalizeScore(payload.suggestedScore);
  const rawConfidence = Number(payload.confidence || 60);
  const confidence = Math.max(0, Math.min(100, rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence));
  return {
    status: "done",
    source: "Hosted AI API",
    suggestedScore,
    confidence,
    summary: String(payload.summary || "Analyse IA terminee."),
    missing: Array.isArray(payload.missing) ? payload.missing.map(String).slice(0, 6) : [],
    evidence: String(payload.evidence || fallbackEvidence || ""),
    documents: Array.isArray(payload.documents) ? payload.documents.map(String).slice(0, 5) : [],
    risk: String(payload.risk || (suggestedScore === "1" ? "faible" : suggestedScore === "0.5" ? "modere" : "eleve")),
    recommendation: String(payload.recommendation || "Verifier la preuve et confirmer le score en revue humaine."),
    audit: String(payload.audit || `Audit IA: score ${suggestedScore}, confiance ${confidence}%.`)
  };
}

function buildPrompt({ question, answer, documents }) {
  const documentText = (documents || [])
    .map((document) => `- ${document.title || "Document"} (${document.type || "Document"}): ${document.content || ""}`)
    .join("\n");

  return `
Analyse une seule pratique ESG pour une PME.

Question:
Code: ${question.code}
Titre: ${question.title}
Pilier: ${question.pillar}
Description: ${question.description}
Preuves attendues: ${question.evidence}

Reponse entreprise:
Score declare: ${answer.value || "non renseigne"}
Preuve saisie: ${answer.evidence || "aucune"}
Justification: ${answer.justification || "aucune"}

Documents:
${documentText || "Aucun document."}

Regles:
- "0": preuve absente ou pratique non demontree.
- "0.5": preuve partielle, pratique lancee mais incomplete.
- "1": preuve claire, datee, reliee au critere, avec indicateur ou suivi.
- "NA": seulement si non applicable et justifie.

Reponds uniquement en JSON valide:
{
  "suggestedScore": "0|0.5|1|NA",
  "confidence": 0,
  "risk": "faible|modere|eleve|a verifier",
  "summary": "resume court",
  "missing": ["element manquant"],
  "documents": ["documents utilises"],
  "evidence": "preuve retenue",
  "recommendation": "action conseillee",
  "audit": "mini audit de la pratique"
}
`;
}

async function reviewQuestion(payload) {
  if (!AI_API_KEY) throw new Error("Missing AI_API_KEY.");
  const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Tu es un auditeur ESG. Tu reponds uniquement avec un JSON valide." },
        { role: "user", content: buildPrompt(payload) }
      ]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `AI API error ${response.status}`);
  const content = data.choices?.[0]?.message?.content || "{}";
  return normalizeReview(extractJson(content), payload.answer?.evidence);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function hasSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function loadSnapshot(companyId) {
  if (!hasSupabase()) return memorySnapshots.get(companyId) || null;
  const url = `${SUPABASE_URL}/rest/v1/esg_snapshots?company_id=eq.${encodeURIComponent(companyId)}&select=data`;
  const response = await fetch(url, { headers: supabaseHeaders() });
  const rows = await response.json();
  if (!response.ok) throw new Error(rows.message || `Supabase error ${response.status}`);
  return rows[0]?.data || null;
}

async function saveSnapshot(companyId, data) {
  if (!hasSupabase()) {
    memorySnapshots.set(companyId, data);
    return data;
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/esg_snapshots?on_conflict=company_id`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify([{ company_id: companyId, data, updated_at: new Date().toISOString() }])
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || `Supabase error ${response.status}`);
  return payload[0]?.data || data;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        aiModel: AI_MODEL,
        aiConfigured: Boolean(AI_API_KEY),
        databaseConfigured: hasSupabase()
      });
    }

    if (request.method === "POST" && url.pathname === "/api/review-question") {
      const payload = await readJson(request);
      const review = await reviewQuestion(payload);
      return sendJson(response, 200, { ok: true, review });
    }

    if (request.method === "GET" && url.pathname === "/api/snapshot") {
      const companyId = url.searchParams.get("company_id") || "demo";
      return sendJson(response, 200, { ok: true, data: await loadSnapshot(companyId) });
    }

    if (request.method === "PUT" && url.pathname === "/api/snapshot") {
      const payload = await readJson(request);
      const companyId = payload.company_id || "demo";
      return sendJson(response, 200, { ok: true, data: await saveSnapshot(companyId, payload.data || {}) });
    }

    return sendJson(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    return sendJson(response, 503, { ok: false, error: error.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Turritopsis ESG hosted API running on port ${PORT}`);
});
