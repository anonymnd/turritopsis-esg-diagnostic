import { httpClient } from "../../shared/api-client/httpClient";

export interface Company {
  id: string;
  name: string;
  sector: string;
  city: string | null;
  role: "Owner" | "Collaborator" | "Viewer";
  ice: string | null;
  employeeRange: string | null;
  website: string | null;
  phone: string | null;
  activityDescription: string | null;
  isProfileComplete: boolean;
}

export interface UpdateCompanyProfilePayload {
  city?: string;
  ice?: string;
  employeeRange?: string;
  website?: string;
  phone?: string;
  activityDescription?: string;
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

export async function updateCompanyProfile(payload: UpdateCompanyProfilePayload): Promise<Company> {
  const { data } = await httpClient.put<Company>("/companies", payload);
  return data;
}

function isAxiosNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "response" in error && (error as { response?: { status?: number } }).response?.status === 404;
}
