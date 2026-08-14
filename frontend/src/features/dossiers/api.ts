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
  snapshotJson: string;
  submittedAt: string;
  reviewedAt: string | null;
  updatedAt: string;
}

export interface DossierNote {
  id: string;
  dossierId: string;
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

export async function getQueue(): Promise<Dossier[]> {
  const { data } = await httpClient.get<Dossier[]>("/dossiers");
  return data;
}

export async function getDossier(id: string): Promise<Dossier> {
  const { data } = await httpClient.get<Dossier>(`/dossiers/${id}`);
  return data;
}

export async function updateDossier(id: string, status: DossierStatus, finalScore?: number): Promise<Dossier> {
  const { data } = await httpClient.put<Dossier>(`/dossiers/${id}`, { status, finalScore });
  return data;
}

export async function getNotes(dossierId: string): Promise<DossierNote[]> {
  const { data } = await httpClient.get<DossierNote[]>(`/dossiers/${dossierId}/notes`);
  return data;
}

export async function addNote(dossierId: string, text: string): Promise<void> {
  await httpClient.post(`/dossiers/${dossierId}/notes`, { text });
}
