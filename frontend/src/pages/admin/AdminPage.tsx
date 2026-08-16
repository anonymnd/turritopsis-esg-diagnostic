import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReviewer, getAdminOverview, getReviewers } from "../../features/admin/api";
import styles from "./admin.module.css";

export default function AdminPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  const { data: reviewers } = useQuery({ queryKey: ["admin", "reviewers"], queryFn: getReviewers });
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createReviewerMutation = useMutation({
    mutationFn: () => createReviewer({ email, password }),
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "reviewers"] });
    },
    onError: () => {
      setFormError("Impossible de creer ce compte. Verifiez l'email et le mot de passe (8 caracteres minimum).");
    }
  });

  function handleCreateReviewer(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    createReviewerMutation.mutate();
  }

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
        <h3>Reviseurs</h3>
        <form className={styles.form} onSubmit={handleCreateReviewer}>
          <div className={styles.field}>
            <label htmlFor="reviewerEmail">Email</label>
            <input
              id="reviewerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="r.benali@turritopsis.ma"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reviewerPassword">Mot de passe</label>
            <input
              id="reviewerPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <button type="submit" className={styles.submit} disabled={createReviewerMutation.isPending}>
            {createReviewerMutation.isPending ? "Un instant…" : "Creer le reviseur"}
          </button>
          {formError && <p className={styles.error}>{formError}</p>}
        </form>
        <div className={styles.table} style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {!reviewers || reviewers.length === 0 ? (
                <tr>
                  <td style={{ color: "var(--ink-muted)" }}>Aucun reviseur.</td>
                </tr>
              ) : (
                reviewers.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
