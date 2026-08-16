import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Leaf, ScanSearch, ShieldCheck, Users } from "lucide-react";
import SiteNav from "../../shared/components/SiteNav";
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
      <SiteNav />

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
            <img src="/logo-icon.png" alt="Turritopsis" className={styles.jellyfishImg} />
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
