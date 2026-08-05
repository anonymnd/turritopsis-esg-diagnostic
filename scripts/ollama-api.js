import http from "node:http";

const PORT = Number(process.env.ESG_API_PORT || 3001);
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Ollama response did not contain JSON.");
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
  const missing = Array.isArray(payload.missing) ? payload.missing.map(String).slice(0, 6) : [];
  const documents = Array.isArray(payload.documents) ? payload.documents.map(String).slice(0, 5) : [];

  return {
    status: "done",
    source: "Ollama local",
    suggestedScore,
    confidence,
    summary: String(payload.summary || "Analyse locale terminee."),
    missing,
    evidence: String(payload.evidence || fallbackEvidence || ""),
    documents,
    risk: String(payload.risk || (suggestedScore === "1" ? "faible" : suggestedScore === "0.5" ? "modere" : "eleve")),
    recommendation: String(payload.recommendation || "Verifier la preuve et confirmer le score en revue humaine."),
    audit: String(payload.audit || `Audit IA local: score ${suggestedScore}, confiance ${confidence}%.`)
  };
}

function buildPrompt({ question, answer, documents }) {
  const documentText = (documents || [])
    .map((document) => `- ${document.title || "Document"} (${document.type || "Document"}): ${document.content || ""}`)
    .join("\n");

  return `
Tu es un auditeur ESG pour PME. Analyse les preuves et propose un score pour UNE pratique ESG.

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

Documents charges:
${documentText || "Aucun document."}

Regles de score:
- "0": preuve absente ou pratique non demontree.
- "0.5": preuve partielle, pratique lancee mais incomplete.
- "1": preuve claire, datee, reliee au critere, avec indicateur ou suivi.
- "NA": seulement si non applicable et justifie.

Reponds uniquement avec un JSON valide:
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

async function callOllama(payload) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildPrompt(payload),
      stream: false,
      format: "json",
      options: {
        temperature: 0.1,
        top_p: 0.8
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return normalizeReview(extractJson(data.response || "{}"), payload.answer?.evidence);
}

async function health() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error(`Ollama health failed: ${response.status}`);
  const data = await response.json();
  return {
    ok: true,
    model: OLLAMA_MODEL,
    models: Array.isArray(data.models) ? data.models.map((model) => model.name) : []
  };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  try {
    if (request.method === "GET" && request.url === "/api/health") {
      return sendJson(response, 200, await health());
    }

    if (request.method === "POST" && request.url === "/api/review-question") {
      const payload = await readBody(request);
      if (!payload.question) return sendJson(response, 400, { ok: false, error: "Missing question." });
      const review = await callOllama(payload);
      return sendJson(response, 200, { ok: true, review });
    }

    return sendJson(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    return sendJson(response, 503, {
      ok: false,
      error: error.message,
      model: OLLAMA_MODEL,
      ollamaUrl: OLLAMA_URL
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Turritopsis ESG Ollama API running on http://127.0.0.1:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
});
