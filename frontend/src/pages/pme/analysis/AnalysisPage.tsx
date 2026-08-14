import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSnapshot } from "../../../features/questionnaire/api";
import { computeScores } from "../../../features/questionnaire/scoring";
import { submitDossier } from "../../../features/dossiers/api";
import styles from "./analysis.module.css";

export default function AnalysisPage() {
  const queryClient = useQueryClient();
  const { data: answers, isPending } = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });

  const submitMutation = useMutation({
    mutationFn: () => {
      const scores = computeScores(answers ?? {});
      return submitDossier(scores.overall, scores.overall);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dossier", "mine"] })
  });

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  const scores = computeScores(answers ?? {});

  return (
    <div className={styles.wrap}>
      <h2>Analyse IA</h2>
      <p className={styles.subtitle}>Triage automatique avant l'envoi au reviseur — ceci ne fixe pas le score final.</p>

      <div className={styles.scoreCard}>
        <div className={styles.scoreCircle}>
          <span className={styles.scoreValue}>{scores.overall}</span>
          <span className={styles.scoreLabel}>provisoire</span>
        </div>
        <div className={styles.pillarRow}>
          <div className={styles.pillarChip} style={{ background: "var(--pillar-e-tint)", color: "var(--pillar-e-dark)" }}>
            <b>{scores.E}</b>
            <span>E</span>
          </div>
          <div className={styles.pillarChip} style={{ background: "var(--pillar-s-tint)", color: "var(--pillar-s-dark)" }}>
            <b>{scores.S}</b>
            <span>S</span>
          </div>
          <div className={styles.pillarChip} style={{ background: "var(--pillar-g-tint)", color: "var(--pillar-g-dark)" }}>
            <b>{scores.G}</b>
            <span>G</span>
          </div>
        </div>
      </div>

      <button type="button" className={styles.submitBtn} onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
        Soumettre le dossier pour revue
      </button>
      {submitMutation.isSuccess && (
        <p className={styles.confirmation}>Dossier soumis — le statut passe a « Soumis » cote reviseur.</p>
      )}
    </div>
  );
}
