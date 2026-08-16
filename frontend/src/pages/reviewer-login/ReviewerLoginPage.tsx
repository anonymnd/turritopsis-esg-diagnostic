import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import BrandLogo from "../../shared/components/BrandLogo";
import styles from "./reviewer-login.module.css";

export default function ReviewerLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await login({ email, password });
      // Same login for both roles — an admin lands on the admin overview,
      // a reviewer on the queue. Anything else (a PME account, say) never
      // gets past this page, even with valid credentials.
      if (session.roles.includes("admin")) {
        navigate("/reviewer/admin");
      } else if (session.roles.includes("reviewer")) {
        navigate("/reviewer");
      } else {
        logout();
        setError("Ce compte n'a pas acces a cet espace.");
      }
    } catch {
      setError("Identifiants incorrects.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Link to="/" className={styles.brand}>
          <BrandLogo size={24} />
        </Link>
        <div className={styles.kicker}>Acces interne</div>
        <h3 className={styles.title}>Connexion equipe</h3>
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
            {submitting ? "Un instant…" : "Se connecter"}
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
