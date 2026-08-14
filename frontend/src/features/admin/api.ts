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
