import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../src/features/questionnaire/questions";
import type { Answers } from "../src/features/questionnaire/api";
import { computeScores } from "../src/features/questionnaire/scoring";

describe("computeScores", () => {
  it("returns 100 for each pillar when every criterion has a full score", () => {
    const answers: Answers = {};
    for (const { code } of QUESTIONS) {
      answers[code] = { score: "1" };
    }

    expect(computeScores(answers)).toEqual({ overall: 100, E: 100, S: 100, G: 100 });
  });

  it("excludes unanswered and N/A criteria and rounds the pillar and overall averages", () => {
    const answers: Answers = {
      E1: { score: "1" },
      E2: { score: "0" },
      E3: { score: "0" },
      S1: { score: "1" },
      G1: { score: "1" },
      G2: { score: "NA" },
    };

    expect(computeScores(answers)).toEqual({ overall: 78, E: 33, S: 100, G: 100 });
  });

  it("returns zero for pillars with no evaluable answers", () => {
    const answers: Answers = {
      E1: { score: "NA" },
      G1: { score: "NA" },
    };

    expect(computeScores(answers)).toEqual({ overall: 0, E: 0, S: 0, G: 0 });
    expect(computeScores({})).toEqual({ overall: 0, E: 0, S: 0, G: 0 });
  });
});
