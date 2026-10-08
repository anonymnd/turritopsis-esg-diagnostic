import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, Leaf, ListChecks, ShieldCheck, Users } from "lucide-react";
import { getSnapshot, saveSnapshot, type Answers, type ScoreValue } from "../api";
import { PILLAR_LABELS, QUESTIONS, type Pillar } from "../questions";
import styles from "./questionnaire.module.css";

const PILLARS = [{id: "E", icon: Leaf, description: "Ressources, énergie et impact environnemental."}, {id: "S", icon: Users, description: "Conditions de travail et responsabilité sociale."}, {id: "G", icon: ShieldCheck, description: "Éthique, transparence et gouvernance."}] as const;
const SCORE_CHOICES: { value: ScoreValue; label: string; detail: string }[] = [
  { value: "1", label: "Conforme", detail: "Pratique mise en place" },
  { value: "0.5", label: "Partiel", detail: "Pratique en cours" },
  { value: "0", label: "Non conforme", detail: "Pratique non mise en place" },
  { value: "NA", label: "N/A", detail: "Non applicable à mon activité" }
];

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const snapshot = useQuery({ queryKey: ["snapshot"], queryFn: getSnapshot });
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("E");
  const [localAnswers, setLocalAnswers] = useState<Answers | null>(null);
  const answers = localAnswers ?? snapshot.data ?? {};
  const answeredCount = QUESTIONS.filter(q => answers[q.code]?.score !== undefined).length;
  const percentage = Math.round(answeredCount / QUESTIONS.length * 100);
  const saveMutation = useMutation({ mutationFn: saveSnapshot, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snapshot"] }) });
  const current = QUESTIONS[index];
  const currentAnswer = answers[current.code] ?? {};

  function selectScore(value: ScoreValue) {
    const next = { ...answers, [current.code]: { ...currentAnswer, score: value } };
    setLocalAnswers(next); saveMutation.mutate(next);
  }
  function goTo(nextIndex: number) {
    const bounded = Math.max(0, Math.min(QUESTIONS.length - 1, nextIndex));
    setIndex(bounded); setSelectedPillar(QUESTIONS[bounded].pillar);
  }

  if (snapshot.isPending) return <div className={styles.wrap} aria-busy="true"><p>Chargement de votre questionnaire…</p></div>;
  if (snapshot.isError) return <div className={styles.wrap} role="alert"><h1>Impossible de charger vos réponses</h1><p>Vérifiez votre connexion puis réessayez.</p><button className={styles.primary} onClick={() => void snapshot.refetch()}>Réessayer</button></div>;

  return <div className={styles.wrap}>
    <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><ol><li><Link to="/app">Tableau de bord</Link></li><li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Questionnaire ESG</span></li></ol></nav>
    <header className={styles.header}><div><p className={styles.eyebrow}>ÉTAPE 02 · VOTRE PARCOURS ESG</p><h1>Vos pratiques, un critère à la fois.</h1><p className={styles.subtitle}>Explorez les trois piliers ESG et faites le point à votre rythme. Vous pouvez revenir sur chaque réponse.</p></div><img src="/images/dashboard/questionnaire.svg" alt="" width="240" height="130" /></header>
    <section className={styles.progressCard} aria-label="Votre progression"><div><ListChecks size={22} aria-hidden="true" /><span><strong>{answeredCount} / {QUESTIONS.length}</strong> critères renseignés</span></div><progress max={QUESTIONS.length} value={answeredCount} aria-label="Progression du questionnaire" /><span className={styles.percent}>{percentage}%</span></section>
    <section className={styles.explorer} aria-label="Explorer les questions">
      <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls="question-explorer" onClick={() => setExpanded(!expanded)}><span><strong>Les questions de votre diagnostic</strong><span>Environnement, Social et Gouvernance</span></span><span className={styles.toggleAction}>{expanded ? "Masquer" : "Explorer"}<ChevronDown size={20} className={expanded ? styles.rotated : undefined} aria-hidden="true" /></span></button>
      <div id="question-explorer" className={styles.explorerBody} hidden={!expanded}>{expanded && <>
        <div className={styles.pillarChoices} aria-label="Choisir un pilier">{PILLARS.map(({id,icon:Icon,description}) => {
          const questions = QUESTIONS.filter(q => q.pillar === id);
          const count = questions.filter(q => answers[q.code]?.score !== undefined).length;
          return <button type="button" key={id} aria-pressed={selectedPillar === id} className={`${styles.pillarChoice} ${styles[id]} ${selectedPillar === id ? styles.pillarSelected : ""}`} onClick={() => setSelectedPillar(id)}><Icon size={22} aria-hidden="true" /><strong>{PILLAR_LABELS[id]}</strong><span>{description}</span><small>{count} / {questions.length} renseignés</small></button>;
        })}</div>
        <div className={styles.questionGrid} aria-label={`Questions : ${PILLAR_LABELS[selectedPillar]}`}>{QUESTIONS.map((q,i) => q.pillar === selectedPillar && <button key={q.code} type="button" aria-current={i === index ? "step" : undefined} className={`${styles.questionTile} ${i === index ? styles.questionSelected : ""}`} onClick={() => goTo(i)}><span className={styles.questionCode}>{q.code}</span><span className={styles.tileTitle}>{q.title}</span><span className={styles.tileStatus}>{answers[q.code]?.score !== undefined ? <><Check size={13} aria-hidden="true" />Répondu</> : "À renseigner"}</span></button>)}</div>
      </>}</div>
    </section>
    <div className={styles.layout}>
      <section className={styles.questionCard} aria-labelledby="current-question-title">
        <div className={styles.questionMeta}><span className={`${styles.pillarBadge} ${styles[current.pillar]}`}>{PILLAR_LABELS[current.pillar]}</span><span>Question {index + 1} / {QUESTIONS.length}</span></div>
        <h2 id="current-question-title">{current.title}</h2><p className={styles.detail}>{current.detail}</p>
        <fieldset className={styles.scoreField} disabled={saveMutation.isPending}><legend>Comment situez-vous votre entreprise ?</legend><div className={styles.scoreOptions}>{SCORE_CHOICES.map(choice => <button key={choice.value} type="button" aria-pressed={currentAnswer.score === choice.value} className={`${styles.scoreOption} ${currentAnswer.score === choice.value ? styles.scoreSelected : ""}`} onClick={() => selectScore(choice.value)}><span>{choice.label}{currentAnswer.score === choice.value && <CheckCircle2 size={16} aria-hidden="true" />}</span><small>{choice.detail}</small></button>)}</div></fieldset>
        <div className={styles.saveState} role="status">{saveMutation.isPending ? "Enregistrement de votre réponse…" : saveMutation.isError ? "Votre réponse n’a pas pu être enregistrée." : saveMutation.isSuccess && currentAnswer.score !== undefined ? <><CheckCircle2 size={15} aria-hidden="true" />Réponse enregistrée</> : "Vos choix sont enregistrés automatiquement."}</div>
        {saveMutation.isError && <button type="button" className={styles.retry} onClick={() => saveMutation.mutate(answers)}>Réessayer l’enregistrement</button>}
        <div className={styles.footer}><button type="button" className={styles.ghost} disabled={index === 0} onClick={() => goTo(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Précédent</button><button type="button" className={styles.skip} disabled={index === QUESTIONS.length - 1} onClick={() => goTo(index + 1)}>Passer</button><button type="button" className={styles.primary} disabled={saveMutation.isPending || saveMutation.isError} onClick={() => index === QUESTIONS.length - 1 ? navigate("/app/proofs") : goTo(index + 1)}>{index === QUESTIONS.length - 1 ? "Terminer" : "Suivant"}<ArrowRight size={16} aria-hidden="true" /></button></div>
      </section>
      <aside className={styles.guide}><img src="/images/dashboard/evidence.svg" alt="" width="240" height="130" /><p className={styles.eyebrow}>UNE RÉPONSE BIEN ÉTAYÉE</p><h2>Vos preuves font la différence.</h2><p>Documents, politiques internes ou exemples concrets : ajoutez les éléments qui illustrent vos pratiques.</p><Link to={`/app/proofs?question=${current.code}`}>Ajouter une preuve<ArrowRight size={16} aria-hidden="true" /></Link><div className={styles.help}><p>Un doute sur votre réponse ?</p><Link to={`/app/proofs?question=${current.code}`}>Obtenir de l’aide avec l’IA<ChevronRight size={15} aria-hidden="true" /></Link></div></aside>
    </div>
  </div>;
}
