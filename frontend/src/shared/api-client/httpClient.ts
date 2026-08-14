import axios from "axios";
import { getAccessToken, clearSession } from "../../features/auth/session";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006/api/v1";

export const httpClient = axios.create({ baseURL });

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);
