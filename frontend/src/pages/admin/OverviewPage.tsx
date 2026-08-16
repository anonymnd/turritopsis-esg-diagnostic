import { useQuery } from "@tanstack/react-query";
import { getAdminOverview, getReviewers } from "../../features/admin/api";
import styles from "./admin.module.css";

export default function OverviewPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  const { data: reviewers } = useQuery({ queryKey: ["admin", "reviewers"], queryFn: getReviewers });

  if (isPending) return <p>Chargement…</p>;
  if (isError || !data) return <p>Acces reserve aux comptes administrateur.</p>;

  const submitted = data.companies.filter((c) => c.dossierStatus).length;
  const statusCounts = data.companies.reduce<Record<string, number>>((acc, c) => {
    const key = c.dossierStatus ?? "Aucun dossier";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.wrap}>
      <h2>Vue d'ensemble</h2>

      <div className={styles.statGrid}>
        <div className={styles.statTile}>
          <strong>{data.companies.length}</strong>
          <span>Entreprises</span>
        </div>
        <div className={styles.statTile}>
          <strong>{reviewers?.length ?? "—"}</strong>
          <span>Reviseurs</span>
        </div>
        <div className={styles.statTile}>
          <strong>{submitted}</strong>
          <span>Dossiers soumis</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Repartition par statut</h3>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Statut</th>
                <th>Entreprises</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(statusCounts).map(([status, count]) => (
                <tr key={status}>
                  <td>{status}</td>
                  <td style={{ fontWeight: 700 }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Activite recente</h3>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.auditLog.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ color: "var(--ink-muted)" }}>
                    Aucune entree.
                  </td>
                </tr>
              ) : (
                data.auditLog.slice(0, 8).map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ color: "var(--ink-muted)" }}>{new Date(entry.createdAt).toLocaleString("fr-FR")}</td>
                    <td>{entry.action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
