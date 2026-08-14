import { useQuery } from "@tanstack/react-query";
import { getMyDossier, type Dossier } from "../../../features/dossiers/api";
import { computeScores } from "../../../features/questionnaire/scoring";
import type { Answers } from "../../../features/questionnaire/api";
import styles from "./report.module.css";

const STATUS_LABELS: Record<Dossier["status"], string> = {
  Submitted: "Soumis, en attente de revue",
  InReview: "En cours de revue",
  Validated: "Valide",
  Rejected: "Renvoye pour complements"
};

export default function ReportPage() {
  const { data: dossier, isPending } = useQuery({ queryKey: ["dossier", "mine"], queryFn: getMyDossier });

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className={styles.wrap}>
        <h2>Rapport ESG</h2>
        <div className={styles.statusCard}>
          <p style={{ margin: 0, color: "var(--ink-muted)" }}>
            Aucun dossier soumis pour le moment. Completez le questionnaire puis soumettez-le depuis l'analyse IA.
          </p>
        </div>
      </div>
    );
  }

  if (dossier.status !== "Validated") {
    return (
      <div className={styles.wrap}>
        <h2>Rapport ESG</h2>
        <div className={styles.statusCard}>
          <p style={{ margin: 0 }}>{STATUS_LABELS[dossier.status]}</p>
        </div>
      </div>
    );
  }

  let snapshot: Answers = {};
  try {
    snapshot = JSON.parse(dossier.snapshotJson) as Answers;
  } catch {
    snapshot = {};
  }
  const scores = computeScores(snapshot);
  const finalScore = dossier.finalScore ?? scores.overall;

  return (
    <div className={styles.wrap}>
      <h2>Rapport ESG</h2>
      <p className={styles.subtitle}>Dossier valide {dossier.reviewedAt ? `le ${new Date(dossier.reviewedAt).toLocaleDateString("fr-FR")}` : ""}</p>

      <div className={styles.scoreCard}>
        <div className={styles.scoreValue}>{finalScore}/100</div>
        <div className={styles.bars}>
          <BarRow label="Environ." value={scores.E} color="var(--pillar-e)" />
          <BarRow label="Social" value={scores.S} color="var(--pillar-s)" />
          <BarRow label="Gouvern." value={scores.G} color="var(--pillar-g)" />
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, width: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}
