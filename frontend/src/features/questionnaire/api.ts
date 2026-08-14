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
  try {
    return JSON.parse(data.dataJson) as Answers;
  } catch {
    return {};
  }
}

export async function saveSnapshot(answers: Answers): Promise<void> {
  await httpClient.put("/snapshots", { dataJson: JSON.stringify(answers) });
}
