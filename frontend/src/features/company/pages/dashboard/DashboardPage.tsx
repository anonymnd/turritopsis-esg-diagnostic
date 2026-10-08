import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronRight, FileCheck2, Leaf, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompany } from "../../useCompany";
import { getSnapshot, QUESTIONS } from "../../../questionnaire/index";
import { listDocuments } from "../../../documents/index";
import { getMyDossier } from "../../../dossiers/index";
import styles from "./dashboard.module.css";

const ROLE_LABELS: Record<string, string> = { Owner: "Propriétaire", Collaborator: "Collaborateur", Viewer: "Lecteur" };
const STATUS_LABELS = { Submitted: "Dossier soumis", InReview: "En cours de revue", Validated: "Dossier validé", Rejected: "À compléter" };
const STEPS = [
  { to: "/app/company-info", title: "Votre entreprise", body: "Posez les bases de votre diagnostic avec les informations de votre entreprise.", image: "company", label: "Compléter mon profil" },
  { to: "/app/questionnaire", title: "Questionnaire ESG", body: "Faites le point sur vos pratiques environnementales, sociales et de gouvernance.", image: "questionnaire", label: "Ouvrir le questionnaire" },
  { to: "/app/proofs", title: "Documents & preuves", body: "Appuyez vos réponses avec les documents qui illustrent vos engagements.", image: "evidence", label: "Gérer mes preuves" },
  { to: "/app/analysis", title: "Analyse de votre dossier", body: "Examinez les résultats de l’analyse assistée par IA avant la revue humaine.", image: "analysis", label: "Voir mon analyse" },
  { to: "/app/report", title: "Rapport & recommandations", body: "Retrouvez vos soumissions et, après validation, votre score et vos recommandations.", image: "report", label: "Consulter mon rapport" }
];

export default function DashboardPage() {
  const companyQuery = useCompany();
  const answers = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const documents = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const dossier = useQuery({ queryKey: ["dossier", "mine"], queryFn: getMyDossier });
  const company = companyQuery.data;
  const answered = QUESTIONS.filter(q => answers.data?.[q.code]?.score !== undefined).length;
  const progress = Math.round(answered / QUESTIONS.length * 100);
  const nextStep = !company?.isProfileComplete ? STEPS[0] : answered < QUESTIONS.length ? STEPS[1] : !documents.data?.length ? STEPS[2] : dossier.data?.status === "Validated" ? STEPS[4] : STEPS[3];
  const metricsPending = answers.isPending || documents.isPending || dossier.isPending;
  const metricsError = answers.isError || documents.isError || dossier.isError;
  const retry = () => { void companyQuery.refetch(); void answers.refetch(); void documents.refetch(); void dossier.refetch(); };

  if (companyQuery.isPending) return <div className={styles.wrap} aria-busy="true" aria-label="Chargement du tableau de bord"><div className={styles.skeletonHeader} /><div className={styles.skeletonHero} /><div className={styles.stepsGrid}>{STEPS.map(step => <div key={step.image} className={styles.skeletonCard} />)}</div></div>;
  if (companyQuery.isError || !company) return <div className={styles.wrap}><div className={styles.error} role="alert"><h1>Votre tableau de bord est indisponible</h1><p>Impossible de charger votre entreprise. Vérifiez votre connexion puis réessayez.</p><button className={styles.primary} onClick={retry}>Réessayer</button></div></div>;

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>VOTRE ESPACE ENTREPRISE</p><h1>Tableau de bord</h1><p className={styles.subtitle}>{company.name}<span aria-hidden="true"> · </span>{company.sector}{company.city ? ` · ${company.city}` : ""}</p></div>
        <span className={styles.roleBadge}><ShieldCheck size={16} aria-hidden="true" />{ROLE_LABELS[company.role] ?? company.role}</span>
      </header>
      <section className={styles.hero} aria-labelledby="journey-title">
        <div className={styles.heroContent}>
          <span className={styles.heroKicker}><Leaf size={16} aria-hidden="true" /> UN PAS VERS UN IMPACT DURABLE</span>
          <h2 id="journey-title">Vos engagements.<br />Un diagnostic clair.</h2>
          <p>Avancez à votre rythme : renseignez vos pratiques, ajoutez vos preuves et construisez votre diagnostic ESG.</p>
          <Link className={styles.primary} to={metricsPending || metricsError ? "/app/questionnaire" : nextStep.to}>{metricsPending || metricsError ? "Ouvrir mon questionnaire" : company.isProfileComplete ? "Continuer mon diagnostic" : "Commencer mon diagnostic"}<ArrowRight size={18} aria-hidden="true" /></Link>
          <span className={styles.heroHint}>Vos réponses sont enregistrées au fil de votre parcours.</span>
        </div>
        <div className={styles.heroVisual}><img src="/images/dashboard/impact.svg" alt="Une entreprise au cœur d’un écosystème durable" width="480" height="360" /></div>
      </section>
      <section className={styles.overview} aria-label="État de votre diagnostic">
        <div className={styles.metric}><span className={styles.metricLabel}>Profil entreprise</span><strong>{company.isProfileComplete ? "Complété" : "À compléter"}</strong><span className={styles.metricDetail}>{company.isProfileComplete ? "Les informations essentielles sont renseignées." : "Renseignez vos informations pour commencer."}</span></div>
        <div className={styles.metric}><span className={styles.metricLabel}>Questionnaire</span><strong>{answers.isError ? "Indisponible" : answers.isPending ? "Chargement…" : <>{answered}<span className={styles.metricUnit}> / {QUESTIONS.length} critères</span></>}</strong><progress aria-label="Progression du questionnaire" max={100} value={progress} /><span className={styles.metricDetail}>Réponses renseignées, tous piliers confondus.</span></div>
        <div className={styles.metric}><span className={styles.metricLabel}>Preuves de travail</span><strong>{documents.isError ? "Indisponible" : documents.isPending ? "Chargement…" : <>{documents.data?.length ?? 0}<span className={styles.metricUnit}> document{documents.data?.length === 1 ? "" : "s"}</span></>}</strong><span className={styles.metricDetail}>Pièces jointes et justificatifs textuels.</span></div>
        <div className={styles.metric}><span className={styles.metricLabel}>Votre dossier</span><strong className={styles.statusValue}>{dossier.isError ? "Indisponible" : dossier.isPending ? "Chargement…" : dossier.data ? STATUS_LABELS[dossier.data.status] : "Pas encore soumis"}</strong><span className={styles.metricDetail}>Le score final est validé par un évaluateur.</span></div>
      </section>
      {metricsError && <div className={styles.inlineError} role="alert">Certaines informations n’ont pas pu être chargées.<button onClick={retry}>Réessayer</button></div>}
      <section aria-labelledby="steps-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>VOTRE PARCOURS ESG</p><h2 id="steps-title">Chaque étape compte.</h2></div><span>5 étapes, à votre rythme</span></div>
        <div className={styles.stepsGrid}>
          {STEPS.map((step, index) => <Link key={step.to} to={step.to} className={styles.stepCard}>
            <div className={styles.cardImage}><img src={`/images/dashboard/${step.image}.svg`} alt="" width="480" height="260" loading="lazy" /><span className={styles.stepNumber}>0{index + 1}</span>{index === 0 && company.isProfileComplete && <span className={styles.completeBadge}><Check size={14} aria-hidden="true" />Complété</span>}</div>
            <div className={styles.cardContent}><span className={styles.stepKicker}>ÉTAPE {index + 1}</span><h3>{step.title}</h3><p>{step.body}</p><span className={styles.cardAction}>{step.label}<ChevronRight size={18} aria-hidden="true" /></span></div>
          </Link>)}
          <aside className={styles.evidenceNote}><img className={styles.noteImage} src="/images/dashboard/preserved.svg" alt="" width="160" height="100" loading="lazy" /><p className={styles.stepKicker}>VOS PREUVES, PRÉSERVÉES</p><h3>Une trace de chaque soumission.</h3><p>À chaque nouvelle soumission, une copie de vos réponses et documents est conservée. Modifier vos documents de travail ne modifie pas cette copie.</p><Link to="/app/report"><FileCheck2 size={17} aria-hidden="true" />Retrouver mes soumissions<ArrowRight size={17} aria-hidden="true" /></Link></aside>
        </div>
      </section>
      <footer className={styles.footer}><ShieldCheck size={16} aria-hidden="true" /><span>Analyse assistée par IA · Décision finale humaine</span><span className={styles.footerBrand}>Turritopsis ESG</span></footer>
    </div>
  );
}
