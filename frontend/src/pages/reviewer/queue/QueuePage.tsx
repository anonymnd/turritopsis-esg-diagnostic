import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getQueue, type Dossier } from "../../../features/dossiers/api";
import styles from "./queue.module.css";

const STATUS_STYLE: Record<Dossier["status"], { bg: string; fg: string; label: string }> = {
  Submitted: { bg: "var(--status-progress-tint)", fg: "var(--status-progress)", label: "Soumis" },
  InReview: { bg: "var(--status-warn-tint)", fg: "var(--status-warn)", label: "En cours" },
  Validated: { bg: "var(--status-ok-tint)", fg: "var(--status-ok)", label: "Valide" },
  Rejected: { bg: "var(--status-bad-tint)", fg: "var(--status-bad)", label: "Rejete" }
};

const STATUS_OPTIONS: { value: Dossier["status"] | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "Submitted", label: "Soumis" },
  { value: "InReview", label: "En cours" },
  { value: "Validated", label: "Valide" },
  { value: "Rejected", label: "Rejete" }
];

export default function QueuePage() {
  const navigate = useNavigate();
  const { data: dossiers, isPending } = useQuery({ queryKey: ["dossiers", "queue"], queryFn: getQueue });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Dossier["status"] | "all">("all");

  const filtered = useMemo(() => {
    if (!dossiers) return [];
    const term = search.trim().toLowerCase();
    return dossiers.filter((d) => {
      const matchesSearch = !term || (d.companyName ?? "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dossiers, search, statusFilter]);

  return (
    <div className={styles.wrap}>
      <h2>File de dossiers</h2>
      <p className={styles.subtitle}>{dossiers?.length ?? 0} dossiers</p>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise…"
        />
        <select
          className={styles.statusSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Dossier["status"] | "all")}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Soumis le</th>
              <th>Score</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={4}>Chargement…</td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((d) => {
                const status = STATUS_STYLE[d.status];
                return (
                  <tr key={d.id} onClick={() => navigate(`/reviewer/dossiers/${d.id}`)}>
                    <td>{d.companyName ?? d.companyId}</td>
                    <td style={{ color: "var(--ink-muted)" }}>{new Date(d.submittedAt).toLocaleDateString("fr-FR")}</td>
                    <td style={{ fontWeight: 700 }}>{d.reviewedScore ?? d.declaredScore ?? "-"}</td>
                    <td>
                      <span className={styles.tag} style={{ background: status.bg, color: status.fg }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ color: "var(--ink-muted)" }}>
                  {dossiers && dossiers.length > 0 ? "Aucun resultat pour ce filtre." : "Aucun dossier en attente."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
