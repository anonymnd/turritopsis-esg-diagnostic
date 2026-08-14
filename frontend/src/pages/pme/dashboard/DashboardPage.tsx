import { useNavigate } from "react-router-dom";
import { useCompany } from "../../../features/company/useCompany";
import styles from "./dashboard.module.css";

const ROLE_LABELS: Record<string, string> = {
  Owner: "Proprietaire",
  Collaborator: "Collaborateur",
  Viewer: "Lecteur"
};

const STEPS = [
  { to: "/app/questionnaire", kicker: "Etape 1", title: "Questionnaire", body: "27 criteres E/S/G a completer." },
  { to: "/app/proofs", kicker: "Etape 2", title: "Preuves", body: "Documents justificatifs par critere." },
  { to: "/app/analysis", kicker: "Etape 3", title: "Analyse IA", body: "Triage automatique avant revue." },
  { to: "/app/report", kicker: "Etape 4", title: "Rapport", body: "Disponible apres validation." }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: company, isPending, isError } = useCompany();

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p className={styles.state}>Chargement…</p>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className={styles.wrap}>
        <p className={styles.state}>Impossible de charger votre entreprise. Reessayez plus tard.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h2>Tableau de bord</h2>
      <p className={styles.subtitle}>
        {company.name} — {company.sector}
        {company.city ? `, ${company.city}` : ""}
      </p>
      <span className={styles.roleBadge}>{ROLE_LABELS[company.role] ?? company.role}</span>

      <div className={styles.stepsGrid}>
        {STEPS.map((step) => (
          <button key={step.to} type="button" className={`${styles.stepCard} lift`} onClick={() => navigate(step.to)}>
            <div className={styles.stepKicker}>{step.kicker}</div>
            <div className={styles.stepTitle}>{step.title}</div>
            <p className={styles.stepBody}>{step.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
