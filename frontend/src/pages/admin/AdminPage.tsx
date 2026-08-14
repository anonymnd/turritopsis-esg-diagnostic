import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../../features/admin/api";
import styles from "./admin.module.css";

export default function AdminPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.wrap}>
        <p>Acces reserve aux comptes administrateur.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h2>Administration</h2>

      <div className={styles.section}>
        <h3>Entreprises</h3>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Secteur</th>
                <th>Statut dossier</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.companies.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--ink-muted)" }}>
                    Aucune entreprise.
                  </td>
                </tr>
              ) : (
                data.companies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td style={{ color: "var(--ink-muted)" }}>{c.sector}</td>
                    <td>{c.dossierStatus ?? "—"}</td>
                    <td style={{ fontWeight: 700 }}>{c.score ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Journal d'audit</h3>
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
                data.auditLog.map((entry) => (
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
