import { httpClient } from "../../shared/api-client/httpClient";

export interface AiPrivacyInfo {
  mode: "signals-only" | "local-only";
  rawDocumentTextSent: boolean;
  requiresHumanVerification: boolean;
}

export interface QuestionReviewResult {
  privacy?: AiPrivacyInfo;
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
  privacy?: AiPrivacyInfo;
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

export async function reviewDossier(dossierId: string, revisionId?: string | null): Promise<DossierReviewResult> {
  const { data } = await httpClient.post<DossierReviewResult>(`/ai/review-dossier/${dossierId}`, undefined, {params: {revisionId}});
  return data;
}
