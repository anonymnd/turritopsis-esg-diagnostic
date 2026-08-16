import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSnapshot, saveSnapshot, type Answers, type ScoreValue } from "../../../features/questionnaire/api";
import { PILLAR_LABELS, QUESTIONS, type Pillar } from "../../../features/questionnaire/questions";
import styles from "./questionnaire.module.css";

const PILLAR_COLOR: Record<Pillar, string> = { E: "var(--pillar-e)", S: "var(--pillar-s)", G: "var(--pillar-g)" };
const PILLAR_TINT: Record<Pillar, string> = { E: "var(--pillar-e-tint)", S: "var(--pillar-s-tint)", G: "var(--pillar-g-tint)" };
const PILLAR_DARK: Record<Pillar, string> = { E: "var(--pillar-e-dark)", S: "var(--pillar-s-dark)", G: "var(--pillar-g-dark)" };

const SCORE_CHOICES: { value: ScoreValue; label: string }[] = [
  { value: "1", label: "Conforme" },
  { value: "0.5", label: "Partiel" },
  { value: "0", label: "Non conforme" },
  { value: "NA", label: "N/A" }
];

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: savedAnswers, isPending } = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const [index, setIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Answers | null>(null);

  const answers = localAnswers ?? savedAnswers ?? {};
  const answeredCount = useMemo(() => Object.values(answers).filter((a) => a.score).length, [answers]);

  const saveMutation = useMutation({
    mutationFn: saveSnapshot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snapshot"] })
  });

  if (isPending) {
    return <p style={{ padding: 32 }}>Chargement…</p>;
  }

  const current = QUESTIONS[index];
  const currentAnswer = answers[current.code] ?? {};

  function selectScore(value: ScoreValue) {
    const next: Answers = { ...answers, [current.code]: { ...currentAnswer, score: value } };
    setLocalAnswers(next);
    saveMutation.mutate(next);
  }

  function goTo(nextIndex: number) {
    setIndex(Math.max(0, Math.min(QUESTIONS.length - 1, nextIndex)));
  }

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navProgress}>{answeredCount} / {QUESTIONS.length} repondues</div>
        <div className={styles.navBar}>
          <div className={styles.navBarFill} style={{ width: `${Math.round((answeredCount / QUESTIONS.length) * 100)}%` }} />
        </div>
        {QUESTIONS.map((q, i) => (
          <button
            key={q.code}
            type="button"
            className={`${styles.navRow} ${i === index ? styles.navRowActive : ""}`}
            style={{ background: i === index ? PILLAR_TINT[q.pillar] : "transparent" }}
            onClick={() => goTo(i)}
          >
            <span className={styles.navDot} style={{ background: PILLAR_COLOR[q.pillar] }} />
            <span className={styles.navLabel}>{q.title}</span>
            {answers[q.code]?.score && <span className={styles.navCheck}>✓</span>}
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        <div>
          <span className={styles.pillarBadge} style={{ background: PILLAR_TINT[current.pillar], color: PILLAR_DARK[current.pillar] }}>
            {PILLAR_LABELS[current.pillar]}
          </span>
          <span className={styles.qPosition}>
            Question {index + 1} / {QUESTIONS.length}
          </span>
        </div>
        <h2 className={styles.qTitle}>{current.title}</h2>
        <p className={styles.qDetail}>{current.detail}</p>
        <button
          type="button"
          className={styles.aiHelpBtn}
          onClick={() => navigate(`/app/proofs?question=${current.code}`)}
        >
          Pas sur de votre reponse ? Obtenir de l'aide avec l'IA →
        </button>

        <div className={styles.fieldLabel}>Votre score</div>
        <div className={styles.scoreOptions}>
          {SCORE_CHOICES.map((choice) => {
            const active = currentAnswer.score === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                className={styles.scoreOption}
                style={
                  active
                    ? { borderColor: PILLAR_COLOR[current.pillar], background: PILLAR_COLOR[current.pillar], color: "#fff" }
                    : undefined
                }
                onClick={() => selectScore(choice.value)}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btnGhost} disabled={index === 0} onClick={() => goTo(index - 1)}>
            ← Precedent
          </button>
          <button type="button" className={styles.btnSkip} onClick={() => goTo(index + 1)}>
            Passer
          </button>
          <div className={styles.footerSpacer} />
          <button type="button" className={styles.btnPrimary} onClick={() => goTo(index + 1)}>
            {index === QUESTIONS.length - 1 ? "Terminer →" : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
