import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import styles from "./reviewer-login.module.css";

export default function ReviewerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/reviewer");
    } catch {
      setError("Identifiants incorrects.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <strong className={styles.brand}>TURRITOPSIS</strong>
        <div className={styles.kicker}>Acces interne</div>
        <h3 className={styles.title}>Connexion reviseur</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Identifiant</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="r.benali@turritopsis.ma" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Un instant…" : "Acceder a la file"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
        <Link to="/" className={styles.backLink}>
          ← Retour au site public
        </Link>
      </div>
    </div>
  );
}
