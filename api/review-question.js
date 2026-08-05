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
    riskLevel: signalCount >= 2 ? "modere" : "eleve",
    summary: "Analyse automatique provisoire: ajoutez des preuves datees, verifiables et reliees a la pratique.",
    auditQuestions: [
      `Quel document confirme la pratique ${question?.code || ""} ?`,
      "Qui est responsable de cette pratique dans l'entreprise ?",
      "Quelle periode ou date la preuve couvre-t-elle ?"
    ],
    missingEvidence: [
      "Document source identifiable",
      "Date ou periode de reporting",
      "Responsable ou validation interne"
    ]
  };
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

  if (!ai.apiKey) {
    return sendJson(res, 200, { ok: true, review: fallbackReview(question, effectiveScore, effectiveProof, effectiveJustification) });
  }

  try {
    const prompt = [
      "Tu es un auditeur ESG pour PME. Analyse la reponse, la justification et la preuve.",
      "Retourne uniquement un JSON valide avec: suggestedScore, confidence, proofStrength, riskLevel, summary, auditQuestions, missingEvidence.",
      "Scores autorises: 0, 0.5, 1. Pour NA ou incertain, sois prudent.",
      "",
      `Question: ${JSON.stringify(question)}`,
      `Score declare: ${effectiveScore}`,
      `Preuve: ${effectiveProof || ""}`,
      `Justification: ${effectiveJustification || ""}`
    ].join("\n");

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
    const content = payload.choices?.[0]?.message?.content || "{}";
    return sendJson(res, 200, { ok: true, review: JSON.parse(content) });
  } catch (error) {
    return sendJson(res, 200, {
      ok: true,
      review: {
        ...fallbackReview(question, effectiveScore, effectiveProof, effectiveJustification),
        summary: `Analyse IA indisponible, revue heuristique utilisee. Detail technique: ${error.message.slice(0, 120)}`
      }
    });
  }
}
