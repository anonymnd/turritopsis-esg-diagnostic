import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import * as authApi from "./api";
import { clearSession, getSession, setSession, type Session } from "./session";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  login: (payload: authApi.LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      register: async (payload) => {
        const next = await authApi.register(payload);
        setSession(next);
        setSessionState(next);
      },
      login: async (payload) => {
        const next = await authApi.login(payload);
        setSession(next);
        setSessionState(next);
      },
      logout: () => {
        clearSession();
        setSessionState(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
