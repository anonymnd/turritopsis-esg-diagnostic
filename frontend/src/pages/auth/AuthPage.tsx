import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import SiteNav from "../../shared/components/SiteNav";
import styles from "./auth.module.css";

type Tab = "signup" | "login";

export default function AuthPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "login" ? "login" : "signup";

  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setTab(next: Tab) {
    setSearchParams({ tab: next });
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (tab === "signup") {
        await register({ email, password, companyName, sector });
        navigate("/app");
      } else {
        const session = await login({ email, password });
        // Reviewer/admin accounts don't belong in the PME app shell —
        // send them to the dedicated internal login instead.
        if (session.roles.includes("admin") || session.roles.includes("reviewer")) {
          navigate("/review/login");
        } else {
          navigate("/app");
        }
      }
    } catch {
      setError(tab === "signup" ? "Impossible de creer le compte. Verifiez les informations saisies." : "Email ou mot de passe incorrect.");
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
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === "signup" ? styles.tabActive : ""}`}
              onClick={() => setTab("signup")}
            >
              Creer une entreprise
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
              onClick={() => setTab("login")}
            >
              Connexion
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "signup" ? (
              <>
                <h3 className={styles.title}>Creer votre entreprise</h3>
                <p className={styles.subtitle}>Vous serez proprietaire du compte et pourrez inviter des collaborateurs.</p>
                <div className={styles.field}>
                  <label htmlFor="companyName">Nom de l'entreprise</label>
                  <input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Atlas Textile SARL"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="sector">Secteur d'activite</label>
                  <input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Confection textile" required />
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.title}>Connexion</h3>
                <p className={styles.subtitle}>Proprietaire, collaborateur ou lecteur — connectez-vous a votre entreprise.</p>
              </>
            )}

            <div className={styles.field}>
              <label htmlFor="email">E-mail professionnel</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.ma"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {tab === "login" && (
              <a href="#" className={styles.forgotLink}>
                Mot de passe oublie ?
              </a>
            )}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "Un instant…" : tab === "signup" ? "Creer le compte" : "Se connecter"}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
