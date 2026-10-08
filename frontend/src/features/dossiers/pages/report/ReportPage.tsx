import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, FileCheck2, FileText, History, Leaf, Printer, ShieldCheck, Users } from "lucide-react";
import { SubmittedEvidence } from "../../SubmittedEvidence";
import { getMyDossier, type Dossier } from "../../api";
import { computeScores, type Answers } from "../../../questionnaire/index";
import styles from "./report.module.css";

const STATUS_LABELS: Record<Dossier["status"], string> = { Submitted: "Soumis, en attente de revue", InReview: "En cours de revue", Validated: "Validé", Rejected: "Renvoyé pour compléments" };
const PILLARS = [{ id: "E", icon: Leaf }, { id: "S", icon: Users }, { id: "G", icon: ShieldCheck }] as const;
const PILLAR_LABELS = { E: "Environnement", S: "Social", G: "Gouvernance" };

export default function ReportPage() {
  const dossierQuery = useQuery({ queryKey: ["dossier", "mine"], queryFn: getMyDossier });
  const dossier = dossierQuery.data;
  if (dossierQuery.isPending) return <div className={styles.wrap} aria-busy="true"><p>Chargement de votre rapport…</p></div>;
  if (dossierQuery.isError) return <div className={styles.wrap} role="alert"><h1>Impossible de charger votre rapport</h1><p>Vérifiez votre connexion puis réessayez.</p><button className={styles.primary} onClick={() => void dossierQuery.refetch()}>Réessayer</button></div>;
  let snapshot: Answers = {};
  try { const parsed: unknown = JSON.parse(dossier?.snapshotJson ?? "{}"); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) { for (const [code,value] of Object.entries(parsed)) { if (value && typeof value === "object" && "score" in value && ["1", "0.5", "0", "NA"].includes(String(value.score))) snapshot[code] = { score: value.score as Answers[string]["score"] }; } } } catch { /* Legacy snapshots may be unavailable. */ }
  const scores = computeScores(snapshot);
  const validated = dossier?.status === "Validated";

  return <div className={styles.wrap}>
    <nav className={`${styles.breadcrumbs} no-print`} aria-label="Fil d’Ariane"><ol><li><Link to="/app">Tableau de bord</Link></li><li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Rapport ESG</span></li></ol></nav>
    <header className={`${styles.header} no-print`}><div><p className={styles.eyebrow}>ÉTAPE 05 · VOTRE PARCOURS ESG</p><h1>Rapport ESG</h1><p className={styles.subtitle}>Retrouvez les décisions de revue, les recommandations et les preuves conservées à chaque soumission.</p></div><img src="/images/dashboard/report.svg" alt="" width="240" height="130" /></header>
    {!dossier ? <>
      <section className={styles.empty}><img src="/images/dashboard/impact.svg" alt="" width="280" height="210" /><div><p className={styles.eyebrow}>VOTRE RAPPORT SE CONSTRUIT</p><h2>Vos engagements méritent un bilan clair.</h2><p>Aucun dossier soumis pour le moment. Complétez votre questionnaire et ajoutez vos preuves, puis transmettez votre dossier depuis l’analyse.</p><Link to="/app/analysis" className={styles.primary}>Préparer ma soumission<ArrowRight size={17} aria-hidden="true" /></Link></div></section>
      <div className={styles.emptySteps}><Link to="/app/questionnaire"><span className={styles.stepNumber}>01</span><h3>Renseigner vos pratiques</h3><p>Complétez les trois piliers du questionnaire ESG.</p><span>Revenir au questionnaire<ArrowRight size={16} aria-hidden="true" /></span></Link><Link to="/app/proofs"><span className={styles.stepNumber}>02</span><h3>Étayer vos réponses</h3><p>Ajoutez les documents et notes qui illustrent vos engagements.</p><span>Gérer mes preuves<ArrowRight size={16} aria-hidden="true" /></span></Link><Link to="/app/analysis"><span className={styles.stepNumber}>03</span><h3>Soumettre pour revue</h3><p>Un évaluateur examine le dossier et valide le score final.</p><span>Voir mon analyse<ArrowRight size={16} aria-hidden="true" /></span></Link></div>
    </> : <>
      <div className={styles.printHeader}><img src="/logo-icon.png" alt="" /><h1>{dossier.companyName ?? "Rapport ESG"}</h1><p>Diagnostic ESG · Turritopsis ESG Diagnostic</p></div>
      <section className={`${styles.statusCard} ${validated ? styles.validated : ""}`} aria-label="État du dossier"><span className={styles.statusIcon}>{validated ? <CheckCircle2 size={24} aria-hidden="true" /> : <Clock3 size={24} aria-hidden="true" />}</span><div><h2>{STATUS_LABELS[dossier.status]}</h2><p>{dossier.status === "Rejected" ? "Consultez le retour de l’évaluateur et complétez vos réponses ou preuves avant une nouvelle soumission." : validated ? "Votre dossier a été examiné. Retrouvez le score final et les recommandations ci-dessous." : "Votre rapport final sera disponible après validation par un évaluateur."}</p></div>{validated && <button type="button" className={`${styles.primary} no-print`} onClick={() => window.print()}><Printer size={17} aria-hidden="true" />Télécharger le rapport (PDF)</button>}</section>
      <dl className={styles.metadata}><div><dt>Entreprise</dt><dd>{dossier.companyName ?? "Votre entreprise"}</dd></div><div><dt>Soumis le</dt><dd>{new Date(dossier.submittedAt).toLocaleDateString("fr-FR")}</dd></div><div><dt>Version actuelle</dt><dd>{dossier.currentRevisionId ? `Révision ${dossier.revisionNumber}` : "Dossier historique"}</dd></div><div><dt>Dernière revue</dt><dd>{dossier.reviewedAt ? new Date(dossier.reviewedAt).toLocaleDateString("fr-FR") : "En attente"}</dd></div></dl>
      {validated && <>
        <section className={styles.scoreCard} aria-labelledby="final-score-title"><div><p className={styles.eyebrow}>RÉSULTAT VALIDÉ</p><h2 id="final-score-title">Votre score ESG final.</h2><p>Score confirmé lors de la revue de votre dossier.</p><span className={styles.humanBadge}><ShieldCheck size={15} aria-hidden="true" />Validation humaine</span></div><div className={styles.scoreValue}>{dossier.finalScore ?? "—"}<span>{dossier.finalScore !== null ? "/100" : "Indisponible"}</span></div></section>
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>VOS RÉPONSES SOUMISES</p><h2>Les trois piliers de votre diagnostic.</h2><p>Ces scores sont calculés à partir des réponses de la soumission. Ils sont distincts du score final validé.</p></div>
        <section className={styles.pillarGrid} aria-label="Scores déclaratifs par pilier">{PILLARS.map(({id,icon:Icon}) => <article className={`${styles.pillarCard} ${styles[id]}`} key={id}><span className={styles.pillarIcon}><Icon size={22} aria-hidden="true" /></span><h3>{PILLAR_LABELS[id]}</h3><strong>{scores[id]}<small>/100</small></strong><progress aria-label={`Score déclaratif ${PILLAR_LABELS[id]}`} max={100} value={scores[id]} /></article>)}</section>
      </>}
      {dossier.recommendations && <section className={styles.recommendations}><span className={styles.sectionIcon}><FileText size={22} aria-hidden="true" /></span><div><p className={styles.eyebrow}>LE RETOUR DE L’ÉVALUATEUR</p><h2>{validated ? "Vos pistes d’amélioration." : "Les compléments attendus."}</h2><div className={styles.recommendationsText}>{dossier.recommendations}</div></div></section>}
      <section className={`${styles.historyCard} no-print`}><div className={styles.historyHeading}><span className={styles.sectionIcon}><History size={22} aria-hidden="true" /></span><div><p className={styles.eyebrow}>VOTRE DOSSIER DANS LE TEMPS</p><h2>Chaque soumission garde sa trace.</h2><p>Consultez les versions, décisions et documents associés.</p></div></div><SubmittedEvidence dossier={dossier} /></section>
      {!validated && <div className={`${styles.returnLinks} no-print`}><Link to="/app/proofs">Consulter mes preuves<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/app/analysis">Revenir à l’analyse<ArrowRight size={16} aria-hidden="true" /></Link></div>}
      {validated && <div className={styles.signatureBlock}><div>Évaluateur</div><div>Date</div></div>}
    </>}
    <footer className={`${styles.footer} no-print`}><FileCheck2 size={17} aria-hidden="true" /><span>Les documents de travail peuvent évoluer. Les copies soumises restent conservées.</span></footer>
  </div>;
}
