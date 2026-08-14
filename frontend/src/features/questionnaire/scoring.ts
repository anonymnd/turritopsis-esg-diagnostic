import { QUESTIONS, type Pillar } from "./questions";
import type { Answers } from "./api";

export interface PillarScores {
  overall: number;
  E: number;
  S: number;
  G: number;
}

function pillarScore(answers: Answers, pillar: Pillar): number {
  const scored = QUESTIONS.filter((q) => q.pillar === pillar)
    .map((q) => answers[q.code]?.score)
    .filter((s): s is "1" | "0.5" | "0" => s === "1" || s === "0.5" || s === "0");

  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, s) => acc + Number(s), 0);
  return Math.round((sum / scored.length) * 100);
}

export function computeScores(answers: Answers): PillarScores {
  const E = pillarScore(answers, "E");
  const S = pillarScore(answers, "S");
  const G = pillarScore(answers, "G");
  return { overall: Math.round((E + S + G) / 3), E, S, G };
}
