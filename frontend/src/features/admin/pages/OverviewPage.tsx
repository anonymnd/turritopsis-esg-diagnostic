import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getAdminOverview, getReviewers } from "../api";
import { PushQueueHealth } from "../../notifications/index";
import WorkspacePageHeader from "../../../shared/components/WorkspacePageHeader";
import styles from "./admin.module.css";

const STATUS_LABELS: Record<string, string> = { Submitted: "Soumis", InReview: "En cours de revue", Validated: "Validé", Rejected: "À compléter", "Aucun dossier": "Aucun dossier" };

export default function OverviewPage() {
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  const reviewers = useQuery({ queryKey: ["admin", "reviewers"], queryFn: getReviewers });
  const data = overview.data;
  const statusCounts = data?.companies.reduce<Record<string, number>>((acc, company) => {
    const key = company.dossierStatus ?? "Aucun dossier"; acc[key] = (acc[key] ?? 0) + 1; return acc;
  }, {}) ?? {};
  return <div className={styles.wrap}>
    <WorkspacePageHeader title="Vue d'ensemble" eyebrow="PILOTAGE DE LA PLATEFORME" image="analysis" description="Suivez les entreprises, l’équipe de revue et les dernières activités de votre plateforme ESG." breadcrumbs={[{ label: "Espace équipe", to: "/reviewer" }, { label: "Administration" }]} />
    {overview.isPending ? <div className={styles.empty} role="status">Chargement de la vue d’ensemble…</div> : overview.isError || !data ? <div className={styles.error} role="alert"><p>Impossible de charger la vue d’ensemble.</p><button className={styles.secondary} onClick={() => void overview.refetch()}>Réessayer</button></div> : <>
      <section className={styles.statGrid} aria-label="Indicateurs de la plateforme">
        <Link className={styles.statTile} to="/reviewer/admin/companies"><img src="/images/dashboard/company.svg" alt="" width="160" height="90" /><span>Entreprises</span><strong>{data.companies.length}</strong><small>Consulter les entreprises <ArrowRight size={15} aria-hidden="true" /></small></Link>
        <Link className={styles.statTile} to="/reviewer/admin/reviewers"><img src="/images/dashboard/questionnaire.svg" alt="" width="160" height="90" /><span>Reviseurs</span><strong>{reviewers.isPending ? "…" : reviewers.isError ? "Indisponible" : reviewers.data?.length ?? 0}</strong><small>Gérer l’équipe de revue <ArrowRight size={15} aria-hidden="true" /></small></Link>
        <Link className={styles.statTile} to="/reviewer/all"><img src="/images/dashboard/report.svg" alt="" width="160" height="90" /><span>Dossiers soumis</span><strong>{data.companies.filter(company => company.dossierStatus).length}</strong><small>Explorer les dossiers <ArrowRight size={15} aria-hidden="true" /></small></Link>
      </section>
      {reviewers.isError && <div className={styles.error} role="alert"><p>Le nombre de réviseurs est indisponible.</p><button className={styles.secondary} onClick={() => void reviewers.refetch()}>Réessayer les réviseurs</button></div>}
      <div className={styles.overviewGrid}>
        <section className={styles.section} aria-labelledby="status-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>LE PARCOURS DES ENTREPRISES</p><h2 id="status-title">Répartition par statut</h2></div></div>
          {Object.keys(statusCounts).length ? <ul className={styles.statusList}>{Object.entries(statusCounts).map(([status, count]) => <li key={status}><span>{STATUS_LABELS[status] ?? status}</span><strong>{count}</strong></li>)}</ul> : <p className={styles.hint}>Aucune entreprise pour le moment.</p>}
        </section>
        <section className={styles.section} aria-labelledby="activity-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>UNE TRACE DES ACTIONS</p><h2 id="activity-title">Activité récente</h2></div></div>
          {data.auditLog.length ? <ol className={styles.activityList}>{data.auditLog.slice(0, 8).map(entry => <li key={entry.id}><span className={styles.activityMark} aria-hidden="true"><ShieldCheck size={17} /></span><div><p>{entry.action}</p><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("fr-FR")}</time></div></li>)}</ol> : <p className={styles.hint}>Aucune activité pour le moment.</p>}
        </section>
      </div>
    </>}
    <div className={`${styles.section} ${styles.queueHealth}`}><PushQueueHealth /></div>
  </div>;
}
