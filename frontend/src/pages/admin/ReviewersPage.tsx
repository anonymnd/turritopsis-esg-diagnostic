import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReviewer, getReviewers } from "../../features/admin/api";
import styles from "./admin.module.css";

export default function ReviewersPage() {
  const { data: reviewers, isPending } = useQuery({ queryKey: ["admin", "reviewers"], queryFn: getReviewers });
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

  return (
    <div className={styles.wrap}>
      <h2>Reviseurs</h2>

      <div className={styles.section}>
        <h3>Creer un reviseur</h3>
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
      </div>

      <div className={styles.section}>
        <h3>Comptes existants</h3>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td style={{ color: "var(--ink-muted)" }}>Chargement…</td>
                </tr>
              ) : !reviewers || reviewers.length === 0 ? (
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
    </div>
  );
}
