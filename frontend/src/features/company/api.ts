import { httpClient } from "../../shared/api-client/httpClient";

export interface Company {
  id: string;
  name: string;
  sector: string;
  city: string | null;
  role: "Owner" | "Collaborator" | "Viewer";
}

export async function getMyCompany(): Promise<Company | null> {
  try {
    const { data } = await httpClient.get<Company>("/companies");
    return data;
  } catch (error: unknown) {
    if (isAxiosNotFound(error)) return null;
    throw error;
  }
}

function isAxiosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "response" in error && (error as { response?: { status?: number } }).response?.status === 404;
}
