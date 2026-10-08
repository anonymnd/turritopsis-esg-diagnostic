import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronRight, FileCheck2, Leaf, Send, ShieldCheck, Users } from "lucide-react";
import { getSnapshot, computeScores, QUESTIONS, PILLAR_LABELS } from "../../../questionnaire/index";
import { listDocuments } from "../../../documents/index";
import { getMyDossier, submitDossier } from "../../api";
import { apiErrorMessage } from "../../../../shared/api-client/httpClient";
import styles from "./analysis.module.css";

const PILLARS = [{id: "E", icon: Leaf, description: "Votre impact environnemental"}, {id: "S", icon: Users, description: "Vos engagements sociaux"}, {id: "G", icon: ShieldCheck, description: "Vos pratiques de gouvernance"}] as const;
const STATUS_LABELS = { Submitted: "Soumis", InReview: "En cours de revue", Validated: "Validé", Rejected: "À compléter" };

export default function AnalysisPage() {
  const queryClient = useQueryClient();
  const dossierQuery = useQuery({ queryKey: ["dossier", "mine"], queryFn: getMyDossier });
  const snapshot = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const documents = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const dossier = dossierQuery.data;
  const answers = snapshot.data ?? {};
  const scores = computeScores(answers);
  const answered = QUESTIONS.filter(q => answers[q.code]?.score !== undefined).length;
  const proofCount = QUESTIONS.filter(q => documents.data?.some(d => d.questionCode === q.code)).length;
  const submitMutation = useMutation({
    mutationFn: () => submitDossier(scores.overall, scores.overall),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["dossier", "mine"] }); void queryClient.invalidateQueries({ queryKey: ["dossier-history"] }); }
  });
  if (snapshot.isPending) return <div className={styles.wrap} aria-busy="true"><p>Chargement de votre diagnostic…</p></div>;
  if (snapshot.isError) return <div className={styles.wrap} role="alert"><h1>Impossible de charger votre diagnostic</h1><p>Vérifiez votre connexion puis réessayez.</p><button className={styles.submitBtn} onClick={() => void snapshot.refetch()}>Réessayer</button></div>;

  return <div className={styles.wrap}>
    <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><ol><li><Link to="/app">Tableau de bord</Link></li><li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Analyse du dossier</span></li></ol></nav>
    <header className={styles.header}><div><p className={styles.eyebrow}>ÉTAPE 04 · VOTRE PARCOURS ESG</p><h1>Votre diagnostic prend forme.</h1><p className={styles.subtitle}>Faites le point sur vos réponses et vos preuves avant de transmettre votre dossier à un évaluateur.</p></div><img src="/images/dashboard/analysis.svg" alt="" width="240" height="130" /></header>
    <section className={styles.scoreCard} aria-labelledby="score-title"><div className={styles.scoreContent}><p className={styles.eyebrow}>VOTRE SCORE DÉCLARATIF</p><h2 id="score-title">Un premier aperçu de vos pratiques.</h2><p>Ce résultat est calculé à partir de vos réponses au questionnaire. Il est provisoire : le score final sera validé lors de la revue humaine.</p><span className={styles.scoreNote}><ShieldCheck size={15} aria-hidden="true" />Décision finale humaine</span></div><div className={styles.scoreCircle}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" className={styles.ringTrack} /><circle cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${scores.overall} 100`} className={styles.ringValue} /></svg><div><strong>{scores.overall}<small>/100</small></strong><span>Score provisoire</span></div></div></section>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>LES TROIS PILIERS ESG</p><h2>Une vue d’ensemble, pilier par pilier.</h2></div><Link to="/app/questionnaire">Revoir mes réponses<ArrowRight size={16} aria-hidden="true" /></Link></div>
    <section className={styles.pillarRow} aria-label="Scores par pilier">{PILLARS.map(({id,icon:Icon,description}) => {
      const questions = QUESTIONS.filter(q => q.pillar === id);
      const count = questions.filter(q => answers[q.code]?.score !== undefined).length;
      return <article key={id} className={`${styles.pillarCard} ${styles[id]}`}><span className={styles.pillarIcon}><Icon size={22} aria-hidden="true" /></span><h3>{PILLAR_LABELS[id]}</h3><p>{description}</p><strong className={styles.pillarScore}>{scores[id]}<small>/100</small></strong><progress aria-label={`Score ${PILLAR_LABELS[id]}`} max={100} value={scores[id]} /><span className={styles.coverage}>{count} / {questions.length} critères renseignés</span></article>;
    })}</section>
    <p className={styles.calculationNote}>Scores basés sur les réponses évaluables. Les réponses « N/A » ne participent pas au calcul.</p>
    <div className={styles.layout}>
      <section className={styles.submission} aria-labelledby="submission-title"><div className={styles.submissionHead}><span className={styles.submissionIcon}><Send size={22} aria-hidden="true" /></span><div><h2 id="submission-title">Prêt pour la revue ?</h2><p>Vérifiez votre dossier avant de le transmettre.</p></div></div>
        <div className={styles.checklist}><Link to="/app/questionnaire"><span><strong>Vos réponses au questionnaire</strong><small>{answered} / {QUESTIONS.length} critères renseignés</small></span><ChevronRight size={18} aria-hidden="true" /></Link><Link to="/app/proofs"><span><strong>Vos documents justificatifs</strong><small>{documents.isPending ? "Chargement…" : documents.isError ? "Informations indisponibles — consulter les preuves" : `${proofCount} / ${QUESTIONS.length} critères avec une preuve`}</small></span><ChevronRight size={18} aria-hidden="true" /></Link></div>
        <p className={styles.snapshotNote}><FileCheck2 size={18} aria-hidden="true" /><span>La soumission conserve une copie de vos réponses et documents. Vos modifications ultérieures ne changent pas les preuves déjà soumises.</span></p>
        <div className={styles.submitArea}><button type="button" className={styles.submitBtn} onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || dossierQuery.isPending || dossierQuery.isError || dossier?.status === "InReview"}>{submitMutation.isPending ? "Soumission en cours…" : "Soumettre le dossier pour revue"}<ArrowRight size={17} aria-hidden="true" /></button><span>Le score final reste soumis à validation humaine.</span></div>
        {dossier?.status === "InReview" && <p className={styles.info} role="status">Votre dossier est en revue. La resoumission sera possible après le retour de l’évaluateur.</p>}
        {dossierQuery.isError && <p className={styles.error} role="alert">Impossible de vérifier le statut du dossier. <button className={styles.retry} onClick={() => void dossierQuery.refetch()}>Réessayer</button></p>}
        {submitMutation.isError && <p className={styles.error} role="alert">{apiErrorMessage(submitMutation.error, "La soumission a échoué. Réessayez.")}</p>}
        {submitMutation.isSuccess && <p className={styles.confirmation} role="status"><CheckCircle2 size={18} aria-hidden="true" />Dossier soumis — révision {submitMutation.data.revisionNumber}. Vous pouvez suivre son évolution dans votre rapport.</p>}
      </section>
      <aside className={styles.reviewCard}><img src="/images/dashboard/report.svg" alt="" width="240" height="130" /><p className={styles.eyebrow}>LA PROCHAINE ÉTAPE</p><h2>Un regard humain sur votre dossier.</h2><p>L’évaluateur examine vos réponses et justificatifs, puis valide le score final et les recommandations.</p><div className={styles.dossierState}><span>État de votre dossier</span><strong>{dossierQuery.isPending ? "Chargement…" : dossierQuery.isError ? "Indisponible" : dossier ? STATUS_LABELS[dossier.status] : "Pas encore soumis"}</strong>{dossier?.currentRevisionId && <small>Révision {dossier.revisionNumber}</small>}</div><Link to="/app/report">Suivre mon dossier<ArrowRight size={16} aria-hidden="true" /></Link></aside>
    </div>
  </div>;
}
