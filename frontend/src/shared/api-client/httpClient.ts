import axios from "axios";
import { getAccessToken, clearSession } from "../session/session";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006/api/v1";

export const httpClient = axios.create({ baseURL });

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentToken = getAccessToken();
    if (error.response?.status === 401 && (!currentToken || error.config?.headers?.Authorization === `Bearer ${currentToken}`)) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(error) && typeof error.response?.data?.error === "string") {
    return error.response.data.error;
  }
  return fallback;
}
