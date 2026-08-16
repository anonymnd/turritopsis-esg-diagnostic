import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, listDocuments, uploadDocument } from "../../../features/documents/api";
import { getSnapshot, saveSnapshot } from "../../../features/questionnaire/api";
import { QUESTIONS, type Pillar } from "../../../features/questionnaire/questions";
import { reviewQuestion, type QuestionReviewResult } from "../../../features/ai/api";
import styles from "./proofs.module.css";

const PILLAR_COLOR: Record<Pillar, string> = { E: "var(--pillar-e)", S: "var(--pillar-s)", G: "var(--pillar-g)" };

const SCORE_LABEL: Record<string, string> = { "1": "Conforme", "0.5": "Partiel", "0": "Non conforme" };

export default function ProofsPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: documents, isPending } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: answers } = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiCode, setAiCode] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<QuestionReviewResult | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const requested = searchParams.get("question");
    if (requested && QUESTIONS.some((q) => q.code === requested)) {
      setOpenCode(requested);
    }
  }, [searchParams]);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpenCode(null);
      setNote("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] })
  });

  const aiMutation = useMutation({
    mutationFn: reviewQuestion,
    onSuccess: (result, variables) => {
      setAiCode(variables.questionCode);
      setAiResult(result);
      setApplied(false);
    }
  });

  const applyScoreMutation = useMutation({
    mutationFn: async ({ code, score }: { code: string; score: "1" | "0.5" | "0" }) => {
      const current = answers ?? {};
      await saveSnapshot({ ...current, [code]: { ...current[code], score } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      setApplied(true);
    }
  });

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  const byCode = new Map((documents ?? []).map((d) => [d.questionCode, d]));
  const providedCount = QUESTIONS.filter((q) => byCode.has(q.code)).length;

  function submitProof(code: string) {
    const file = fileInputRef.current?.files?.[0];
    uploadMutation.mutate({ questionCode: code, textContent: note || undefined, file });
  }

  function analyseWithAi(code: string, title: string) {
    const doc = byCode.get(code);
    const proofParts = [note, doc?.textContent, doc?.fileName ? `Fichier joint : ${doc.fileName}` : undefined].filter(Boolean);
    aiMutation.mutate({
      questionCode: code,
      questionTitle: title,
      selectedScore: answers?.[code]?.score,
      proofText: proofParts.join(" ")
    });
  }

  function suggestedScoreValue(score: number | null): "1" | "0.5" | "0" | null {
    if (score === null) return null;
    if (score >= 0.75) return "1";
    if (score >= 0.25) return "0.5";
    return "0";
  }

  return (
    <div className={styles.wrap}>
      <h2>Preuves</h2>
      <p className={styles.subtitle}>
        Joignez un document ou une note pour les criteres sensibles. {providedCount} sur {QUESTIONS.length} fournis.
      </p>

      <div className={styles.list}>
        {QUESTIONS.map((q) => {
          const doc = byCode.get(q.code);
          const isOpen = openCode === q.code;
          return (
            <div key={q.code}>
              <div className={styles.row}>
                <span className={styles.pillarDot} style={{ background: PILLAR_COLOR[q.pillar], color: "#fff" }}>
                  {q.pillar}
                </span>
                <div className={styles.rowMain}>
                  <div className={styles.rowLabel}>{q.title}</div>
                  {doc?.fileName && <div className={styles.rowFile}>{doc.fileName}</div>}
                  {doc?.textContent && !doc.fileName && <div className={styles.rowFile}>{doc.textContent}</div>}
                </div>
                <span className={`${styles.tag} ${doc ? styles.tagOk : styles.tagWarn}`}>{doc ? "Fourni" : "A fournir"}</span>
                {doc ? (
                  <button type="button" className={`${styles.action} ${styles.actionDanger}`} onClick={() => deleteMutation.mutate(doc.id)}>
                    Retirer
                  </button>
                ) : (
                  <button type="button" className={styles.action} onClick={() => setOpenCode(isOpen ? null : q.code)}>
                    Ajouter une preuve
                  </button>
                )}
              </div>
              {isOpen && (
                <div className={styles.row} style={{ background: "var(--surface-2)", flexDirection: "column", alignItems: "stretch" }}>
                  <div className={styles.rowMain}>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note ou reference du justificatif"
                      style={{ width: "100%", minHeight: 60, padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                    <input ref={fileInputRef} type="file" style={{ marginTop: 8 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button type="button" className={styles.action} onClick={() => submitProof(q.code)} disabled={uploadMutation.isPending}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className={styles.aiAction}
                      onClick={() => analyseWithAi(q.code, q.title)}
                      disabled={aiMutation.isPending}
                    >
                      {aiMutation.isPending && aiMutation.variables?.questionCode === q.code ? "Analyse en cours…" : "Analyser avec l'IA"}
                    </button>
                  </div>

                  {aiCode === q.code && aiResult && (
                    <div className={styles.aiResult}>
                      <div className={styles.aiResultHead}>
                        <span className={styles.aiResultScore}>
                          Score suggere : {aiResult.suggestedScore !== null ? SCORE_LABEL[suggestedScoreValue(aiResult.suggestedScore) ?? "0"] : "indetermine"}
                        </span>
                        <span className={styles.aiResultConfidence}>Confiance : {aiResult.confidence}%</span>
                      </div>
                      <p className={styles.aiResultSummary}>{aiResult.summary}</p>
                      <p className={styles.aiResultMeta}>
                        Force de la preuve : {aiResult.proofStrength} · Niveau de risque : {aiResult.riskLevel}
                      </p>
                      {aiResult.missingEvidence.length > 0 && (
                        <ul className={styles.aiResultList}>
                          {aiResult.missingEvidence.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {applied ? (
                        <p className={styles.aiApplied}>Score applique au questionnaire. ✓</p>
                      ) : (
                        aiResult.suggestedScore !== null && (
                          <button
                            type="button"
                            className={styles.action}
                            onClick={() => {
                              const value = suggestedScoreValue(aiResult.suggestedScore);
                              if (value) applyScoreMutation.mutate({ code: q.code, score: value });
                            }}
                            disabled={applyScoreMutation.isPending}
                          >
                            Appliquer ce score au questionnaire
                          </button>
                        )
                      )}
                      {applied && (
                        <Link to="/app/questionnaire" className={styles.aiBackLink}>
                          ← Retour au questionnaire
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
