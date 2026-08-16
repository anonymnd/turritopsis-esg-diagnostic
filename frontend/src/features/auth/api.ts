import { httpClient } from "../../shared/api-client/httpClient";
import type { Session } from "./session";

export interface RegisterPayload {
  email: string;
  password: string;
  companyName: string;
  sector: string;
  city?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  companyId: string | null;
  roles: string[];
}

function toSession(response: AuthResponse): Session {
  return {
    accessToken: response.accessToken,
    expiresAt: response.expiresAt,
    userId: response.userId,
    companyId: response.companyId,
    roles: response.roles ?? []
  };
}

export async function register(payload: RegisterPayload): Promise<Session> {
  const { data } = await httpClient.post<AuthResponse>("/auth/register", payload);
  return toSession(data);
}

export async function login(payload: LoginPayload): Promise<Session> {
  const { data } = await httpClient.post<AuthResponse>("/auth/login", payload);
  return toSession(data);
}
