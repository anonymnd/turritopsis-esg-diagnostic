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

export default function QueuePage() {
  const navigate = useNavigate();
  const { data: dossiers, isPending } = useQuery({ queryKey: ["dossiers", "queue"], queryFn: getQueue });

  return (
    <div className={styles.wrap}>
      <h2>File de dossiers</h2>
      <p className={styles.subtitle}>{dossiers?.length ?? 0} dossiers</p>

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
            ) : dossiers && dossiers.length > 0 ? (
              dossiers.map((d) => {
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
                  Aucun dossier en attente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
