import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { registerSessionCleanup, runSessionCleanup } from "../../shared/session/lifecycle";
import * as authApi from "./api";
import { clearSession, getSession, setSession, type Session } from "./session";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  roles: string[];
  register: (payload: authApi.RegisterPayload) => Promise<Session>;
  login: (payload: authApi.LoginPayload) => Promise<Session>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => registerSessionCleanup(async () => { await queryClient.cancelQueries(); queryClient.clear(); }), [queryClient]);
  const [session, setSessionState] = useState<Session | null>(() => getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      roles: session?.roles ?? [],
      register: async (payload) => {
        const next = await authApi.register(payload);
        await queryClient.cancelQueries();
        queryClient.clear();
        setSession(next);
        setSessionState(next);
        return next;
      },
      login: async (payload) => {
        const next = await authApi.login(payload);
        await queryClient.cancelQueries();
        queryClient.clear();
        setSession(next);
        setSessionState(next);
        return next;
      },
      logout: async () => {
        await runSessionCleanup();
        clearSession();
        setSessionState(null);
      }
    }),
    [session, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
