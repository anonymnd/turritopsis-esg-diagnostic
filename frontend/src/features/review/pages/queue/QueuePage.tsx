import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Search } from "lucide-react";
import { getQueue, type Dossier } from "../../../dossiers/index";
import WorkspacePageHeader from "../../../../shared/components/WorkspacePageHeader";
import styles from "./queue.module.css";

const STATUS_STYLE: Record<Dossier["status"], { bg: string; fg: string; label: string }> = {
  Submitted: { bg: "var(--status-progress-tint)", fg: "var(--status-progress)", label: "Soumis" },
  InReview: { bg: "var(--status-warn-tint)", fg: "var(--status-warn)", label: "En cours" },
  Validated: { bg: "var(--status-ok-tint)", fg: "var(--status-ok)", label: "Valide" },
  Rejected: { bg: "var(--status-bad-tint)", fg: "var(--status-bad)", label: "Rejete" }
};
export default function QueuePage({ all = false }: { all?: boolean }) {
  const { data: dossiers, isPending, isError, refetch } = useQuery({ queryKey: ["dossiers", "queue", all], queryFn: () => getQueue(all) });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Dossier["status"] | "all">("all");
  const filtered = useMemo(() => (dossiers ?? []).filter(d => (!search.trim() || (d.companyName ?? "").toLowerCase().includes(search.trim().toLowerCase())) && (statusFilter === "all" || d.status === statusFilter)), [dossiers, search, statusFilter]);
  const title = all ? "Tous les dossiers" : "File de dossiers";
  return <div className={styles.wrap}>
    <WorkspacePageHeader title={title} description={all ? "Retrouvez les soumissions et suivez chaque décision, au même endroit." : "Examinez les preuves, accompagnez les entreprises et préparez votre prochaine revue."} eyebrow="VOTRE ESPACE DE REVUE" image="report" breadcrumbs={[{ label: "Espace réviseur", to: "/reviewer" }, { label: title }]} />
    <div className={styles.metrics}><div><span>Dossiers affichés</span><strong>{isPending || isError ? "—" : filtered.length}</strong></div><div><span>À examiner</span><strong>{isError ? "—" : dossiers?.filter(d => d.status === "Submitted").length ?? "—"}</strong></div><div><span>Revues en cours</span><strong>{isError ? "—" : dossiers?.filter(d => d.status === "InReview").length ?? "—"}</strong></div></div>
    <div className={styles.toolbar}><div className={styles.field}><label htmlFor="queue-search">Rechercher une entreprise</label><div className={styles.searchWrap}><Search size={18} aria-hidden="true" /><input id="queue-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom de l’entreprise…" /></div></div><div className={styles.field}><label htmlFor="queue-status">Statut du dossier</label><select id="queue-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as Dossier["status"] | "all")}><option value="all">Tous les statuts</option>{Object.entries(STATUS_STYLE).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}</select></div></div>
    {isPending ? <p className={styles.empty} role="status">Chargement des dossiers…</p> : isError ? <div className={styles.error} role="alert"><p>Impossible de charger les dossiers.</p><button className={styles.secondary} onClick={() => void refetch()}>Réessayer</button></div> : filtered.length === 0 ? <div className={styles.empty}><img src="/images/dashboard/evidence.svg" alt="" width="180" height="100" /><p>{dossiers?.length ? "Aucun resultat pour ce filtre." : all ? "Aucun dossier pour le moment." : "Aucun dossier en attente."}</p></div> : <ul className={styles.grid} aria-label="Dossiers à consulter">{filtered.map(d => {
      const status = STATUS_STYLE[d.status];
      return <li key={d.id} className={styles.card}><div className={styles.cardTop}><img src="/images/dashboard/company.svg" alt="" width="120" height="65" /><span className={styles.tag} style={{ background: status.bg, color: status.fg }}>{status.label}</span></div><div className={styles.cardBody}><h2>{d.companyName ?? d.companyId}</h2><p className={styles.date}><CalendarDays size={15} aria-hidden="true" />Soumis le {new Date(d.submittedAt).toLocaleDateString("fr-FR")}</p><div className={styles.score}><span>Score indicatif</span><strong>{d.reviewedScore ?? d.declaredScore ?? "—"}<small> / 100</small></strong></div><Link className={styles.open} to={`/reviewer/dossiers/${d.id}`} aria-label={`Examiner le dossier de ${d.companyName ?? d.companyId}`}>Examiner le dossier<ArrowRight size={17} aria-hidden="true" /></Link></div></li>;
    })}</ul>}
  </div>;
}
