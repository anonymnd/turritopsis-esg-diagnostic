import { httpClient } from "../../shared/api-client/httpClient";

export type ScoreValue = "1" | "0.5" | "0" | "NA";

export interface Answer {
  score?: ScoreValue;
  note?: string;
}

export type Answers = Record<string, Answer>;

interface SnapshotResponse {
  companyId: string;
  dataJson: string;
  updatedAt: string;
}

export async function getSnapshot(): Promise<Answers> {
  const { data } = await httpClient.get<SnapshotResponse | null>("/snapshots");
  if (!data) return {};

  let answers: unknown;
  try {
    answers = JSON.parse(data.dataJson);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error("Saved questionnaire responses contain invalid JSON.", { cause: error });
  }

  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    throw new Error("Saved questionnaire responses must be a JSON object.");
  }

  return answers as Answers;
}

export async function saveSnapshot(answers: Answers): Promise<void> {
  await httpClient.put("/snapshots", { dataJson: JSON.stringify(answers) });
}
