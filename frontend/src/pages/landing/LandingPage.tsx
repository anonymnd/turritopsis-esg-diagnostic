import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Leaf, ScanSearch, ShieldCheck, Users } from "lucide-react";
import styles from "./landing.module.css";

const SECTORS = ["Textile", "Agroalimentaire", "Tourisme", "BTP", "Industrie"];

const STEPS = [
  {
    icon: CheckCircle2,
    color: "var(--pillar-e-dark)",
    borderColor: "var(--pillar-e)",
    title: "Questionnaire",
    body: "27 criteres repartis en Environnement, Social et Gouvernance, adaptes a votre secteur d'activite."
  },
  {
    icon: FileText,
    color: "var(--pillar-s-dark)",
    borderColor: "var(--pillar-s)",
    title: "Preuves",
    body: "Chaque reponse sensible peut etre appuyee par un document, une facture ou une note explicative."
  },
  {
    icon: ScanSearch,
    color: "var(--cyan-dark)",
    borderColor: "var(--cyan)",
    title: "Analyse IA",
    body: "Un premier passage automatique repere les preuves faibles ou manquantes avant l'envoi au reviseur."
  },
  {
    icon: ShieldCheck,
    color: "var(--pillar-g-dark)",
    borderColor: "var(--pillar-g)",
    title: "Revue & rapport",
    body: "Un reviseur humain valide ou rejette le dossier, fixe le score final et motive sa decision."
  }
];

const PILLARS = [
  {
    icon: Leaf,
    tint: "var(--pillar-e-tint)",
    accent: "var(--pillar-e)",
    accentDark: "var(--pillar-e-dark)",
    title: "Environnement",
    body: "Energie, eau, dechets, emissions de CO2, produits chimiques et biodiversite locale."
  },
  {
    icon: Users,
    tint: "var(--pillar-s-tint)",
    accent: "var(--pillar-s)",
    accentDark: "var(--pillar-s-dark)",
    title: "Social",
    body: "Securite au travail, remuneration, formation, non-discrimination et impact communautaire."
  },
  {
    icon: ShieldCheck,
    tint: "var(--pillar-g-tint)",
    accent: "var(--pillar-g)",
    accentDark: "var(--pillar-g-dark)",
    title: "Gouvernance",
    body: "Conseil d'administration, anti-corruption, transparence financiere et conformite fiscale."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <header className={styles.nav}>
        <strong>TURRITOPSIS</strong>
        <nav className={styles.navLinks}>
          <a href="#steps">Fonctionnalites</a>
          <a href="#pillars">Piliers ESG</a>
        </nav>
        <div className={styles.navRight}>
          <Link to="/review/login" className={styles.navMuted}>
            Acces reviseur
          </Link>
          <Link to="/auth?tab=login" className={styles.navLogin}>
            Connexion
          </Link>
          <button className={`${styles.pillButton} lift`} onClick={() => navigate("/auth?tab=signup")}>
            Creer un compte
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Diagnostic ESG pour PME marocaines</p>
          <h1 className={styles.heroTitle}>Un score ESG verifie, pas auto-proclame.</h1>
          <p className={styles.heroLead}>
            Repondez au questionnaire E/S/G, joignez vos preuves, et obtenez un score valide par un reviseur
            humain — pas seulement calcule par un algorithme.
          </p>
          <div className={styles.heroActions}>
            <button className={`${styles.pillButton} lift`} onClick={() => navigate("/auth?tab=signup")}>
              Demarrer le diagnostic
            </button>
            <button className={`${styles.pillButtonOutline} lift`} onClick={() => navigate("/auth?tab=login")}>
              J'ai deja un compte
            </button>
          </div>
          <div className={styles.sectorTags}>
            {SECTORS.map((sector) => (
              <span key={sector} className={styles.sectorTag}>
                {sector}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.jellyfish}>
            <JellyfishIllustration />
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardHead}>
                <span className={styles.scoreCardDot} />
                <span className={styles.scoreCardLabel}>Dossier D-1042</span>
              </div>
              <div className={styles.scoreCardBody}>
                <ScoreRing value={82} />
                <div>
                  <div className={styles.scoreCardValue}>82</div>
                  <div className={styles.scoreCardCaption}>score exemple</div>
                </div>
              </div>
              <div className={styles.scoreCardPillars}>
                <span className={styles.scoreCardPillar} style={{ background: "var(--pillar-e-tint)", color: "var(--pillar-e-dark)" }}>
                  68
                </span>
                <span className={styles.scoreCardPillar} style={{ background: "var(--pillar-s-tint)", color: "var(--pillar-s-dark)" }}>
                  64
                </span>
                <span className={styles.scoreCardPillar} style={{ background: "var(--pillar-g-tint)", color: "var(--pillar-g-dark)" }}>
                  48
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="steps" className={styles.sectionBand}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Comment ca marche</h2>
          <p className={styles.sectionLead}>Quatre etapes, du premier questionnaire jusqu'au rapport valide par un reviseur.</p>
          <div className={styles.stepsGrid}>
            {STEPS.map((step) => (
              <article key={step.title} className={`${styles.stepCard} lift`} style={{ borderTopColor: step.borderColor }}>
                <step.icon size={30} color={step.color} strokeWidth={2} className={styles.stepIcon} />
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <section id="pillars" className={styles.section}>
        <h2 className={styles.sectionTitle}>Trois piliers, un score</h2>
        <p className={styles.sectionLead}>Chaque critere du questionnaire appartient a l'un de ces trois piliers, ponderes dans le score final.</p>
        <div className={styles.pillarsGrid}>
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className={`${styles.pillarCard} lift`}
              style={{ background: `linear-gradient(160deg, ${pillar.tint}, var(--surface) 70%)` }}
            >
              <div className={styles.pillarIcon} style={{ background: pillar.accent }}>
                <pillar.icon size={26} color="#fff" strokeWidth={2} />
              </div>
              <h3 style={{ color: pillar.accentDark }}>{pillar.title}</h3>
              <p style={{ color: pillar.accentDark }}>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.ctaBand}>
        <h2>Le score de votre entreprise n'est provisoire que jusqu'a sa validation.</h2>
        <button className={`${styles.pillButton} lift`} onClick={() => navigate("/auth?tab=signup")}>
          Creer mon compte entreprise
        </button>
      </div>

      <footer className={styles.footer}>
        <strong>TURRITOPSIS</strong>
        <span className={styles.footerCopy}>© 2026 Turritopsis — Institut Strategique de Developpement Durable</span>
      </footer>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * value) / 100;
  return (
    <svg width="58" height="58" viewBox="0 0 58 58">
      <circle cx="29" cy="29" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
      <circle
        cx="29"
        cy="29"
        r={radius}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 29 29)"
      />
    </svg>
  );
}

function JellyfishIllustration() {
  return (
    <svg viewBox="0 0 340 400" width="340" height="400">
      <defs>
        <radialGradient id="headGrad" cx="38%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#E9F7C9" />
          <stop offset="30%" stopColor="#8FD17A" />
          <stop offset="60%" stopColor="#2FA05A" />
          <stop offset="100%" stopColor="#0B3E6B" />
        </radialGradient>
        <radialGradient id="gloss" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="t1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1668B0" />
          <stop offset="100%" stopColor="#17B4D9" />
        </linearGradient>
        <linearGradient id="t2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2FA05A" />
          <stop offset="100%" stopColor="#1668B0" />
        </linearGradient>
        <linearGradient id="t3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6D4CC9" />
          <stop offset="100%" stopColor="#17B4D9" />
        </linearGradient>
      </defs>
      <ellipse cx="170" cy="330" rx="90" ry="14" fill="#0B3E6B" opacity=".1" />
      <ellipse cx="170" cy="110" rx="86" ry="70" fill="url(#headGrad)" />
      <ellipse cx="140" cy="85" rx="34" ry="20" fill="url(#gloss)" />
      <g fill="none" strokeWidth="5" strokeLinecap="round" opacity=".92">
        <path className="tentacle" d="M118,155 C98,220 78,245 68,300" stroke="url(#t1)" />
        <path className="tentacle" d="M142,164 C128,225 116,255 110,315" stroke="url(#t2)" />
        <path className="tentacle" d="M170,168 C170,230 170,260 170,320" stroke="url(#t3)" />
        <path className="tentacle" d="M198,164 C212,225 224,255 230,315" stroke="url(#t1)" />
        <path className="tentacle" d="M222,155 C242,220 262,245 272,300" stroke="url(#t2)" />
      </g>
    </svg>
  );
}
