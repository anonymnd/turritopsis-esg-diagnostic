import { httpClient } from "../../shared/api-client/httpClient";

export interface QuestionReviewResult {
  suggestedScore: number | null;
  confidence: number;
  proofStrength: string;
  riskLevel: string;
  summary: string;
  missingEvidence: string[];
}

export interface DossierFlag {
  questionCode: string;
  reason: string;
}

export interface DossierReviewResult {
  assessment: string;
  summary: string;
  recommendedScore: number | null;
  flaggedQuestions: DossierFlag[];
}

export async function reviewQuestion(payload: {
  questionCode: string;
  questionTitle: string;
  selectedScore?: string;
  proofText?: string;
}): Promise<QuestionReviewResult> {
  const { data } = await httpClient.post<QuestionReviewResult>("/ai/review-question", payload);
  return data;
}

export async function reviewDossier(dossierId: string): Promise<DossierReviewResult> {
  const { data } = await httpClient.post<DossierReviewResult>(`/ai/review-dossier/${dossierId}`);
  return data;
}
