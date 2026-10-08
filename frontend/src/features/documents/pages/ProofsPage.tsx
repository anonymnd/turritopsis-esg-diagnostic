import { ArrowRight, ChevronRight, FileText, Leaf, Plus, ShieldCheck, Trash2, UploadCloud, Users } from "lucide-react";
import { SubmittedEvidence, getMyDossier } from "../../dossiers/index";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, listDocuments, uploadDocument } from "../api";
import { getSnapshot, saveSnapshot } from "../../questionnaire/index";
import { PILLAR_LABELS, QUESTIONS, type Pillar } from "../../questionnaire/index";
import { reviewQuestion, type QuestionReviewResult } from "../../ai/index";
import styles from "./proofs.module.css";

const PILLARS = [{ id: "E", icon: Leaf }, { id: "S", icon: Users }, { id: "G", icon: ShieldCheck }] as const;

const SCORE_LABEL: Record<string, string> = { "1": "Conforme", "0.5": "Partiel", "0": "Non conforme" };

export default function ProofsPage() {
  const {data: submittedDossier} = useQuery({queryKey:["dossier","mine"],queryFn:getMyDossier});
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: documents, isPending, isError, refetch } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: answers } = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pillar, setPillar] = useState<Pillar>("E");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiCode, setAiCode] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<QuestionReviewResult | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const requested = searchParams.get("question");
    if (requested && QUESTIONS.some((q) => q.code === requested)) {
      setOpenCode(requested);
      setPillar(QUESTIONS.find(q => q.code === requested)!.pillar);
    }
  }, [searchParams]);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpenCode(null);
      setNote("");
      setFileName("");
      setFileError("");
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

  if (isPending) return <div className={styles.wrap} aria-busy="true"><p>Chargement de vos preuves…</p></div>;
  if (isError) return <div className={styles.wrap} role="alert"><h1>Impossible de charger vos preuves</h1><p>Vérifiez votre connexion puis réessayez.</p><button className={styles.action} onClick={() => void refetch()}>Réessayer</button></div>;

  const byCode = new Map((documents ?? []).map((d) => [d.questionCode, d]));
  const providedCount = QUESTIONS.filter((q) => byCode.has(q.code)).length;

  function submitProof(code: string) {
    const file = fileInputRef.current?.files?.[0];
    uploadMutation.mutate({ questionCode: code, textContent: note || undefined, file });
  }

  function analyseWithAi(code: string, title: string) {
    const doc = byCode.get(code);
    const proofParts = [note, doc?.textContent].filter(Boolean);
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
      <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><ol><li><Link to="/app">Tableau de bord</Link></li><li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Documents & preuves</span></li></ol></nav>
      <header className={styles.header}><div><p className={styles.eyebrow}>ÉTAPE 03 · VOTRE PARCOURS ESG</p><h1>Des preuves pour vos engagements.</h1><p className={styles.subtitle}>Joignez un document ou une note pour illustrer vos pratiques. Retrouvez chaque justificatif dans son pilier ESG.</p></div><img src="/images/dashboard/evidence.svg" alt="" width="240" height="130" /></header>
      <section className={styles.overview} aria-label="Vos justificatifs"><div><span className={styles.metricIcon}><FileText size={22} aria-hidden="true" /></span><div><strong>{providedCount} / {QUESTIONS.length}</strong><p>critères avec une preuve</p></div></div><div><span className={styles.metricIcon}><UploadCloud size={22} aria-hidden="true" /></span><div><strong>Document ou texte</strong><p>Pièces jointes jusqu’à 4 Mo</p></div></div><div><span className={styles.metricIcon}><ShieldCheck size={22} aria-hidden="true" /></span><div><strong>Copies soumises préservées</strong><p>Vos documents de travail restent modifiables.</p></div></div></section>
      <div className={styles.privacy}><ShieldCheck size={20} aria-hidden="true" /><div><strong>Une analyse qui protège vos informations</strong><p>Le texte et les noms des fichiers restent dans l’application. Seuls le critère, le score déclaré et des indices de preuve sont transmis au fournisseur IA. L’évaluateur vérifie les documents originaux.</p></div></div>
      <section className={styles.working} aria-labelledby="working-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>VOS DOCUMENTS DE TRAVAIL</p><h2 id="working-title">Chaque preuve a sa place.</h2></div><Link to="/app/questionnaire">Revenir au questionnaire<ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className={styles.pillars} aria-label="Filtrer par pilier">{PILLARS.map(({id,icon:Icon}) => <button key={id} type="button" aria-pressed={pillar === id} disabled={uploadMutation.isPending} className={`${styles.pillar} ${styles[id]} ${pillar === id ? styles.pillarActive : ""}`} onClick={() => { setPillar(id); setOpenCode(null); setNote(""); setFileName(""); setFileError(""); }}><Icon size={20} aria-hidden="true" /><span>{PILLAR_LABELS[id]}</span><small>{QUESTIONS.filter(q => q.pillar === id && byCode.has(q.code)).length} / {QUESTIONS.filter(q => q.pillar === id).length} fournis</small></button>)}</div>
      {deleteMutation.isError && <p className={styles.error} role="alert">La suppression a échoué. Réessayez.</p>}
      <div className={styles.list}>
        {QUESTIONS.filter(q => q.pillar === pillar).map((q) => {
          const doc = byCode.get(q.code);
          const isOpen = openCode === q.code;
          return (
            <article key={q.code} className={`${styles.proofCard} ${isOpen ? styles.proofCardOpen : ""}`} aria-label={q.title}>
              <div className={styles.row}>
                <span className={`${styles.pillarDot} ${styles[q.pillar]}`}>{q.code}</span>
                <div className={styles.rowMain}>
                  <h3 className={styles.rowLabel}>{q.title}</h3>
                  {doc?.fileName && <div className={styles.rowFile}>{doc.fileName}</div>}
                  {doc?.textContent && !doc.fileName && <div className={styles.rowFile}>{doc.textContent}</div>}
                </div>
                <span className={`${styles.tag} ${doc ? styles.tagOk : styles.tagWarn}`}>{doc ? "Fourni" : "A fournir"}</span>
                {doc ? (
                  <button type="button" className={`${styles.action} ${styles.actionDanger}`} disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(doc.id)}>
                    <Trash2 size={14} aria-hidden="true" />Retirer
                  </button>
                ) : (
                  <button type="button" className={styles.action} disabled={uploadMutation.isPending} aria-expanded={isOpen} onClick={() => { setOpenCode(isOpen ? null : q.code); setNote(""); setFileName(""); setFileError(""); uploadMutation.reset(); }}>
                    <Plus size={15} aria-hidden="true" />{isOpen ? "Fermer" : "Ajouter une preuve"}
                  </button>
                )}
              </div>
              {isOpen && (
                <div className={styles.editor}>
                  <div className={styles.rowMain}>
                    <label className={styles.fieldLabel} htmlFor={`proof-note-${q.code}`}>Votre note ou justificatif textuel</label>
                    <textarea
                      id={`proof-note-${q.code}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note ou reference du justificatif"
                      className={styles.textarea}
                      disabled={uploadMutation.isPending}
                    />
                    <div className={styles.uploadBox}><UploadCloud size={24} aria-hidden="true" /><div><label className={styles.fieldLabel} htmlFor={`proof-file-${q.code}`}>Joindre un document</label><p>Un fichier de 4 Mo maximum. Vous pouvez aussi fournir une note seule.</p><input id={`proof-file-${q.code}`} ref={fileInputRef} type="file" disabled={uploadMutation.isPending} onChange={e => { const file = e.target.files?.[0]; setFileName(file?.name ?? ""); setFileError(file && file.size > 4 * 1024 * 1024 ? "Ce fichier dépasse 4 Mo. Choisissez un fichier plus petit." : ""); }} /></div></div>
                    {fileError && <p className={styles.error} role="alert">{fileError}</p>}
                    {uploadMutation.isError && <p className={styles.error} role="alert">Impossible d’enregistrer cette preuve. Vérifiez le fichier et réessayez.</p>}
                  </div>
                  <div className={styles.editorActions}>
                    <button type="button" className={styles.action} onClick={() => submitProof(q.code)} disabled={uploadMutation.isPending || !!fileError || (!note.trim() && !fileName)}>
                      {uploadMutation.isPending ? "Enregistrement…" : "Enregistrer"}
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

                  {aiMutation.isError && aiMutation.variables?.questionCode === q.code && <p className={styles.error} role="alert">L’analyse est indisponible. Réessayez plus tard.</p>}
                  {applyScoreMutation.isError && <p className={styles.error} role="alert">Le score n’a pas pu être enregistré. Réessayez.</p>}
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
                        {aiResult.privacy?.mode === "local-only"
                          ? "Revue locale : aucun appel au fournisseur IA."
                          : "Analyse limitee aux indices de preuve. Verification humaine requise."}
                      </p>
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
            </article>
          );
        })}
      </div>
      </section>
      <section className={styles.preserved}><img src="/images/dashboard/preserved.svg" alt="" width="160" height="100" /><div><h2>Vos soumissions gardent leurs preuves.</h2><p>Retirer un document de travail ne supprime pas sa copie déjà soumise. Chaque nouvelle soumission conserve ses propres réponses et documents.</p></div><Link to="/app/report">Voir mes soumissions<ArrowRight size={16} aria-hidden="true" /></Link></section>
      {submittedDossier && <div className={styles.history}><SubmittedEvidence dossier={submittedDossier} /></div>}
    </div>
  );
}
