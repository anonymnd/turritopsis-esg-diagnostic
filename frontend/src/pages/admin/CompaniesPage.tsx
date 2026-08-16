import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../../features/admin/api";
import styles from "./admin.module.css";

export default function CompaniesPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });

  if (isPending) return <p>Chargement…</p>;
  if (isError || !data) return <p>Acces reserve aux comptes administrateur.</p>;

  return (
    <div className={styles.wrap}>
      <h2>Entreprises</h2>
      <div className={styles.section}>
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
    </div>
  );
}
