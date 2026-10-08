import { httpClient } from "../../shared/api-client/httpClient";

export type DossierStatus = "Submitted" | "InReview" | "Validated" | "Rejected";

export interface Dossier {
  id: string;
  companyId: string;
  companyName: string | null;
  status: DossierStatus;
  declaredScore: number | null;
  reviewedScore: number | null;
  finalScore: number | null;
  recommendations: string | null;
  snapshotJson: string;
  submittedAt: string;
  reviewedAt: string | null;
  updatedAt: string;
  currentRevisionId: string | null;
  revisionNumber: number;
}

export interface DossierNote {
  id: string;
  dossierId: string;
  revisionId: string | null;
  questionCode: string | null;
  text: string;
  createdAt: string;
}

export async function getMyDossier(): Promise<Dossier | null> {
  const { data } = await httpClient.get<Dossier | null>("/dossiers/mine");
  return data;
}

export async function submitDossier(declaredScore: number, reviewedScore: number): Promise<Dossier> {
  const { data } = await httpClient.post<Dossier>("/dossiers", { declaredScore, reviewedScore });
  return data;
}

export async function getQueue(all = false): Promise<Dossier[]> {
  const { data } = await httpClient.get<Dossier[]>("/dossiers", { params: all ? { all: true } : undefined });
  return data;
}

export async function getDossier(id: string): Promise<Dossier> {
  const { data } = await httpClient.get<Dossier>(`/dossiers/${id}`);
  return data;
}

export async function updateDossier(id: string, status: DossierStatus, finalScore?: number, recommendations?: string, revisionId?: string | null): Promise<Dossier> {
  const { data } = await httpClient.put<Dossier>(`/dossiers/${id}`, { status, finalScore, recommendations, revisionId });
  return data;
}

export async function getNotes(dossierId: string): Promise<DossierNote[]> {
  const { data } = await httpClient.get<DossierNote[]>(`/dossiers/${dossierId}/notes`);
  return data;
}

export async function addNote(dossierId: string, text: string, revisionId?: string | null): Promise<void> {
  await httpClient.post(`/dossiers/${dossierId}/notes`, { text, revisionId });
}

export interface DossierRevision {
 id: string; dossierId: string; number: number; submittedBy: string; submittedAt: string;
 snapshotJson: string; declaredScore: number | null; reviewedScore: number | null;
 status: DossierStatus; finalScore: number | null; recommendations: string | null;
 reviewerId: string | null; reviewedAt: string | null;
}
export async function getRevisions(id: string): Promise<DossierRevision[]> {
 const {data}=await httpClient.get<DossierRevision[]>(`/dossiers/${id}/revisions`);return data;
}

export async function getDossierHistory(): Promise<Dossier[]> {
 const {data}=await httpClient.get<Dossier[]>("/dossiers/history");return data;
}
