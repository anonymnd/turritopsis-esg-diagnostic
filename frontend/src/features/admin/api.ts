import { httpClient } from "../../shared/api-client/httpClient";

export interface AdminCompany {
  id: string;
  name: string;
  sector: string;
  dossierStatus: string | null;
  score: number | null;
}

export interface AdminAuditLogEntry {
  id: string;
  actorId: string | null;
  companyId: string | null;
  action: string;
  createdAt: string;
}

export interface AdminOverview {
  companies: AdminCompany[];
  auditLog: AdminAuditLogEntry[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await httpClient.get<AdminOverview>("/admin/overview");
  return data;
}

export interface Reviewer {
  id: string;
  email: string;
}

export interface CreateReviewerPayload {
  email: string;
  password: string;
}

export async function getReviewers(): Promise<Reviewer[]> {
  const { data } = await httpClient.get<Reviewer[]>("/admin/reviewers");
  return data;
}

export async function createReviewer(payload: CreateReviewerPayload): Promise<void> {
  await httpClient.post("/admin/reviewers", payload);
}
