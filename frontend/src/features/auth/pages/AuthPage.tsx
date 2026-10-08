import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { requestPasswordReset } from "../api";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck, Users } from "lucide-react";
import BrandLogo from "../../../shared/components/BrandLogo";
import styles from "./auth.module.css";

type Tab = "signup" | "login" | "forgot";

export default function AuthPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get(embedded ? "auth" : "tab");
  const tab: Tab = tabParam === "login" ? "login" : tabParam === "forgot" ? "forgot" : "signup";

  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetRequested, setResetRequested] = useState(false);

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams);
    params.set(embedded ? "auth" : "tab", next);
    setSearchParams(params, { replace: embedded });
    setShowPassword(false);
    setError(null);
    setResetRequested(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (tab === "signup") {
        await register({ email, password, companyName, sector });
        navigate("/app");
      } else if (tab === "forgot") {
        // Backend always returns the same generic response whether the
        // email exists or not — nothing to branch on here either.
        await requestPasswordReset(email);
        setResetRequested(true);
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
      if (tab === "signup") {
        setError("Impossible de créer le compte. Vérifiez les informations saisies.");
      } else if (tab === "forgot") {
        setError("Une erreur est survenue. Réessayez dans un instant.");
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={embedded ? styles.embedded : styles.page}>
      {!embedded && <header className={styles.header}><Link to="/" aria-label="Turritopsis — Accueil"><BrandLogo size={32} /></Link><Link to="/" className={styles.homeLink}><ArrowLeft size={16} aria-hidden="true" />Retour à l’accueil</Link></header>}
      <main className={`${styles.wrap} ${embedded ? styles.modalWrap : ""}`}>
        <aside className={styles.visual} aria-label="Votre diagnostic ESG"><div className={styles.visualIntro}><p className={styles.eyebrow}>VOS ENGAGEMENTS, UN IMPACT DURABLE</p><h2>Un meilleur avenir<br />commence avec vous.</h2><p className={styles.visualLead}>Faites le point sur vos pratiques et construisez un diagnostic ESG étayé par vos preuves.</p></div><div className={styles.earthScene}><span className={styles.earthOrbit} aria-hidden="true" /><img src="/logo-icon.png" alt="La Terre stylisée de Turritopsis" width="512" height="512" className={styles.earth} /><span className={styles.reviewBadge}><ShieldCheck size={18} aria-hidden="true" /><span>Votre diagnostic<strong>Une validation humaine</strong></span></span></div><div className={styles.pillars}><span><Leaf size={17} aria-hidden="true" />Environnement</span><span><Users size={17} aria-hidden="true" />Social</span><span><ShieldCheck size={17} aria-hidden="true" />Gouvernance</span></div><p className={styles.visualFooter}>27 critères · 3 piliers · Un parcours à votre rythme</p></aside>
        <section className={styles.card} aria-label={tab === "signup" ? "Créer une entreprise" : tab === "forgot" ? "Réinitialiser le mot de passe" : "Connexion entreprise"}>
          {tab !== "forgot" && <div className={styles.tabs} aria-label="Choisir un accès"><button type="button" disabled={submitting} aria-pressed={tab === "login"} className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`} onClick={() => setTab("login")}>Connexion</button><button type="button" disabled={submitting} aria-pressed={tab === "signup"} className={`${styles.tab} ${tab === "signup" ? styles.tabActive : ""}`} onClick={() => setTab("signup")}>Créer une entreprise</button></div>}
          {tab === "forgot" && resetRequested ? <div className={styles.resetSuccess} role="status"><span className={styles.successIcon}><CheckCircle2 size={28} aria-hidden="true" /></span><p className={styles.eyebrow}>VOTRE DEMANDE EST ENREGISTRÉE</p><h1 className={styles.title}>Vérifiez vos emails.</h1><p className={styles.subtitle}>Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Pensez à vérifier vos courriers indésirables.</p><button type="button" className={styles.submit} onClick={() => setTab("login")}>Retour à la connexion<ArrowRight size={17} aria-hidden="true" /></button></div> : <form onSubmit={handleSubmit}>
            <p className={styles.eyebrow}>{tab === "signup" ? "VOTRE PARCOURS COMMENCE ICI" : tab === "forgot" ? "RETROUVEZ VOTRE ACCÈS" : "VOTRE ESPACE ENTREPRISE"}</p>
            <h1 className={styles.title}>{tab === "signup" ? "Créez votre entreprise." : tab === "forgot" ? "Mot de passe oublié ?" : "Heureux de vous retrouver."}</h1>
            <p className={styles.subtitle}>{tab === "signup" ? "Créez votre espace pour démarrer le diagnostic et inviter vos collaborateurs." : tab === "forgot" ? "Indiquez votre email pour recevoir un lien de réinitialisation." : "Connectez-vous pour retrouver votre diagnostic, vos preuves et votre rapport ESG."}</p>
            {tab === "signup" && <><div className={styles.field}><label htmlFor="companyName">Nom de l’entreprise</label><input id="companyName" autoComplete="organization" disabled={submitting} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Atlas Textile SARL" required /></div><div className={styles.field}><label htmlFor="sector">Secteur d’activité</label><input id="sector" disabled={submitting} value={sector} onChange={e => setSector(e.target.value)} placeholder="Confection textile" required /></div></>}
            <div className={styles.field}><label htmlFor="email">E-mail professionnel</label><div className={styles.inputWrap}><Mail size={18} aria-hidden="true" /><input id="email" type="email" autoComplete="username" disabled={submitting} value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.ma" required /></div></div>
            {tab !== "forgot" && <div className={styles.field}><label htmlFor="password">Mot de passe</label><div className={styles.inputWrap}><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? "text" : "password"} autoComplete={tab === "signup" ? "new-password" : "current-password"} disabled={submitting} value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" minLength={tab === "signup" ? 8 : undefined} aria-describedby={tab === "signup" ? "password-hint" : undefined} required /><button type="button" className={styles.passwordToggle} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword} disabled={submitting} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>{tab === "signup" && <p className={styles.hint} id="password-hint">Utilisez au moins 8 caractères.</p>}</div>}
            {tab === "login" && <div className={styles.forgotRow}><button type="button" disabled={submitting} className={styles.forgotLink} onClick={() => setTab("forgot")}>Mot de passe oublié ?</button></div>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? "Un instant…" : tab === "signup" ? "Créer le compte" : tab === "forgot" ? "Envoyer le lien" : "Se connecter"}<ArrowRight size={17} aria-hidden="true" /></button>
            {tab === "forgot" && <button type="button" disabled={submitting} className={styles.backLink} onClick={() => setTab("login")}><ArrowLeft size={15} aria-hidden="true" />Retour à la connexion</button>}
            {tab === "login" && <p className={styles.signupHint}>Votre entreprise n’a pas encore de compte ? <button type="button" onClick={() => setTab("signup")} disabled={submitting}>Créer mon espace</button></p>}
          </form>}
          <div className={styles.cardFooter}><ShieldCheck size={16} aria-hidden="true" /><span>Un espace dédié à votre diagnostic ESG.</span></div>
        </section>
      </main>
      {!embedded && <footer className={styles.pageFooter}><span>Turritopsis ESG Diagnostic</span><span>De vos engagements à l’action.</span></footer>}
    </div>
  );
}
