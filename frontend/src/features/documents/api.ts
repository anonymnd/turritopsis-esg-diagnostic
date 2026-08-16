import { httpClient } from "../../shared/api-client/httpClient";

export interface ProofDocument {
  id: string;
  questionCode: string;
  label: string | null;
  textContent: string | null;
  fileName: string | null;
  createdAt: string;
}

export interface UploadProofPayload {
  questionCode: string;
  label?: string;
  textContent?: string;
  file?: File;
}

export async function listDocuments(): Promise<ProofDocument[]> {
  const { data } = await httpClient.get<ProofDocument[]>("/documents");
  return data;
}

export async function uploadDocument(payload: UploadProofPayload): Promise<ProofDocument> {
  let fileBase64: string | undefined;
  if (payload.file) {
    fileBase64 = await fileToBase64(payload.file);
  }
  const { data } = await httpClient.post<ProofDocument>("/documents", {
    questionCode: payload.questionCode,
    label: payload.label,
    textContent: payload.textContent,
    fileBase64,
    fileName: payload.file?.name
  });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await httpClient.delete(`/documents/${id}`);
}

export async function listDocumentsForDossier(dossierId: string): Promise<ProofDocument[]> {
  const { data } = await httpClient.get<ProofDocument[]>(`/dossiers/${dossierId}/documents`);
  return data;
}

export async function downloadDocument(id: string, fileName: string): Promise<void> {
  const { data } = await httpClient.get<ProofDocument & { fileBase64: string | null }>(`/documents/${id}`);
  if (!data.fileBase64) return;

  const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
