import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import BrandLogo from "../../../../shared/components/BrandLogo";
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
        <aside className={styles.visual} aria-label="La revue ESG"><p className={styles.kicker}>DES ENGAGEMENTS À L’IMPACT</p><h2>Un regard humain.<br />Des décisions éclairées.</h2><img src="/logo-icon.png" alt="La Terre stylisée de Turritopsis" width="270" height="270" /><p>Examinez les preuves et accompagnez les entreprises dans leur démarche ESG.</p></aside>
        <main className={styles.formPanel}>
        <Link to="/" className={styles.brand}>
          <BrandLogo size={24} />
        </Link>
        <div className={styles.kicker}>Acces interne</div>
        <h1 className={styles.title}>Connexion equipe</h1>
        <p className={styles.intro}>Votre espace dédié à la revue et à l’administration.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Identifiant</label>
            <input id="email" type="email" autoComplete="username" disabled={submitting} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="r.benali@turritopsis.ma" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="current-password" disabled={submitting} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Un instant…" : "Se connecter"}
          </button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
        <Link to="/" className={styles.backLink}>
          ← Retour au site public
        </Link>
        </main>
      </div>
    </div>
  );
}
