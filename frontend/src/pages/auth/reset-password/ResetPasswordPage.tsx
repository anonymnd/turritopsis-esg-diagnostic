import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../../features/auth/api";
import SiteNav from "../../../shared/components/SiteNav";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({ email, token, newPassword });
      setDone(true);
    } catch {
      setError("Ce lien est invalide ou a expire. Demandez-en un nouveau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SiteNav />
      <div className={styles.page}>
        <div className={styles.wrap}>
          <div className={styles.card}>
            {!email || !token ? (
              <>
                <h3 className={styles.title}>Lien invalide</h3>
                <p className={styles.subtitle}>Ce lien de reinitialisation est incomplet. Demandez-en un nouveau.</p>
                <Link to="/auth?tab=forgot" className={styles.submit} style={{ display: "block", textDecoration: "none" }}>
                  Demander un nouveau lien
                </Link>
              </>
            ) : done ? (
              <>
                <h3 className={styles.title}>Mot de passe mis a jour</h3>
                <p className={styles.subtitle}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                <Link to="/auth?tab=login" className={styles.submit} style={{ display: "block", textDecoration: "none" }}>
                  Se connecter
                </Link>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className={styles.title}>Nouveau mot de passe</h3>
                <p className={styles.subtitle}>Choisissez un nouveau mot de passe pour {email}.</p>
                <div className={styles.field}>
                  <label htmlFor="newPassword">Nouveau mot de passe</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
                <button type="submit" className={styles.submit} disabled={submitting}>
                  {submitting ? "Un instant…" : "Mettre a jour"}
                </button>
                {error && <p className={styles.error}>{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
