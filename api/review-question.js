import { aiConfig, handleOptions, readJson, requireUser, sendJson } from "./_shared.js";

function fallbackReview(question, selectedScore, proof, justification) {
  const text = `${proof || ""} ${justification || ""}`.toLowerCase();
  const strongSignals = ["audit", "certificat", "iso", "rapport", "facture", "dashboard", "registre", "politique"];
  const signalCount = strongSignals.filter((word) => text.includes(word)).length;
  const declared = selectedScore === "NA" || selectedScore === "?" ? 0 : Number(selectedScore || 0);

  return {
    suggestedScore: signalCount >= 2 ? declared : Math.min(declared, 0.5),
    confidence: signalCount >= 2 ? 74 : 48,
    proofStrength: signalCount >= 2 ? "moyenne" : "faible",
    riskLevel: signalCount >= 2 ? "modéré" : "élevé",
    summary: "Analyse automatique provisoire : ajoutez des preuves datées, vérifiables et reliées à la pratique.",
    auditQuestions: [
      `Quel document confirme la pratique ${question?.code || ""} ?`,
      "Qui est responsable de cette pratique dans l'entreprise ?",
      "Quelle période ou date la preuve couvre-t-elle ?"
    ],
    missingEvidence: [
      "Document source identifiable",
      "Date ou période de reporting",
      "Responsable ou validation interne"
    ]
  };
}

function makeAuditPrompt(question, selectedScore, proof, justification) {
  return [
    "Tu es un auditeur ESG pour PME. Analyse la réponse, la justification et la preuve.",
    "Retourne uniquement un JSON valide avec : suggestedScore, confidence, proofStrength, riskLevel, summary, auditQuestions, missingEvidence.",
    "N'utilise pas Markdown. N'ajoute pas de bloc ```json. La réponse doit commencer par { et finir par }.",
    "Scores autorisés : 0, 0.5, 1. Pour NA ou incertain, sois prudent.",
    "",
    `Question : ${JSON.stringify(question)}`,
    `Score déclaré : ${selectedScore}`,
    `Preuve : ${proof || ""}`,
    `Justification : ${justification || ""}`
  ].join("\n");
}

function parseAiJson(content) {
  const raw = String(content || "").trim();
  const unfenced = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced;
  return JSON.parse(jsonText);
}

function normalizeAiReview(review) {
  const confidence = Number(review.confidence || 0);
  return {
    ...review,
    confidence: confidence > 0 && confidence <= 1 ? Math.round(confidence * 100) : confidence,
    proofStrength: typeof review.proofStrength === "number"
      ? review.proofStrength >= 0.75 ? "forte" : review.proofStrength >= 0.45 ? "moyenne" : "faible"
      : review.proofStrength,
    riskLevel: String(review.riskLevel || "")
      .replace(/^low$/i, "faible")
      .replace(/^medium$/i, "modere")
      .replace(/^high$/i, "eleve")
  };
}

async function callOpenAiCompatible(ai, prompt) {
  const response = await fetch(`${ai.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ai.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error(await response.text());

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || "{}";
}

async function callOllama(ai, prompt) {
  const response = await fetch(`${ai.baseUrl.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers: {
      ...(ai.apiKey ? { Authorization: `Bearer ${ai.apiKey}` } : {}),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ai.model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      format: "json",
      options: { temperature: 0.2 }
    })
  });

  if (!response.ok) throw new Error(await response.text());

  const payload = await response.json();
  return payload.message?.content || payload.response || "{}";
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  try {
    await requireUser(req);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message });
  }

  const body = await readJson(req);
  const { question, selectedScore, proof, justification, answer, documents = [] } = body;
  const effectiveScore = selectedScore ?? answer?.value;
  const effectiveProof = proof ?? [answer?.evidence, ...documents.map((document) => `${document.title}: ${document.content}`)].filter(Boolean).join("\n");
  const effectiveJustification = justification ?? answer?.justification;
  const ai = aiConfig();
  const localOllama = ai.provider === "ollama" && /^http:\/\/(127\.0\.0\.1|localhost)/.test(ai.baseUrl);

  if (!ai.apiKey && !localOllama) {
    return sendJson(res, 200, { ok: true, review: fallbackReview(question, effectiveScore, effectiveProof, effectiveJustification) });
  }

  try {
    const prompt = makeAuditPrompt(question, effectiveScore, effectiveProof, effectiveJustification);
    const content = ai.provider === "ollama"
      ? await callOllama(ai, prompt)
      : await callOpenAiCompatible(ai, prompt);
    return sendJson(res, 200, { ok: true, review: normalizeAiReview(parseAiJson(content)) });
  } catch (error) {
    return sendJson(res, 200, {
      ok: true,
      review: {
        ...fallbackReview(question, effectiveScore, effectiveProof, effectiveJustification),
        summary: `Analyse IA indisponible, revue heuristique utilisée. Détail technique : ${(error.message || "format de réponse IA illisible").slice(0, 120)}`
      }
    });
  }
}
