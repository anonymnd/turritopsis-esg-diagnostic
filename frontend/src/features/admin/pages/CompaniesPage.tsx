import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { getAdminOverview } from "../api";
import WorkspacePageHeader from "../../../shared/components/WorkspacePageHeader";
import styles from "./admin.module.css";

const STATUS_LABELS: Record<string, string> = { Submitted: "Soumis", InReview: "En cours de revue", Validated: "Validé", Rejected: "À compléter" };
export default function CompaniesPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  return <div className={styles.wrap}>
    <WorkspacePageHeader title="Entreprises" eyebrow="LES ORGANISATIONS ACCOMPAGNÉES" image="company" description="Retrouvez les entreprises inscrites, leur secteur d’activité et l’état de leur dossier ESG." breadcrumbs={[{ label: "Espace équipe", to: "/reviewer" }, { label: "Administration", to: "/reviewer/admin" }, { label: "Entreprises" }]} />
    {isPending ? <div className={styles.empty} role="status">Chargement des entreprises…</div> : isError || !data ? <div className={styles.error} role="alert"><p>Impossible de charger les entreprises.</p><button className={styles.secondary} onClick={() => void refetch()}>Réessayer</button></div> : <>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ANNUAIRE ENTREPRISE</p><h2>{data.companies.length} entreprise{data.companies.length === 1 ? "" : "s"}</h2></div><span className={styles.hint}>Le score affiché correspond au dossier disponible.</span></div>
      {data.companies.length === 0 ? <div className={styles.empty}><img src="/images/dashboard/company.svg" alt="" width="180" height="100" /><p>Aucune entreprise pour le moment.</p></div> : <ul className={styles.cards}>{data.companies.map(company => <li key={company.id} className={styles.companyCard}>
        <div className={styles.companyVisual}><img src="/images/dashboard/company.svg" alt="" width="240" height="130" loading="lazy" /><span className={`${styles.statusTag} ${company.dossierStatus === "Validated" ? styles.statusValid : company.dossierStatus === "Rejected" ? styles.statusRejected : ""}`}>{company.dossierStatus ? STATUS_LABELS[company.dossierStatus] ?? company.dossierStatus : "Aucun dossier"}</span></div>
        <div className={styles.cardContent}><span className={styles.cardKicker}><Building2 size={14} aria-hidden="true" /> ENTREPRISE</span><h3>{company.name}</h3><p>{company.sector || "Secteur non renseigné"}</p><div className={styles.cardFooter}><span>Score du dossier</span><strong>{company.score ?? "—"}{company.score !== null && <small> / 100</small>}</strong></div></div>
      </li>)}</ul>}
    </>}
  </div>;
}
