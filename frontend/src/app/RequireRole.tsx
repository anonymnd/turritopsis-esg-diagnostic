import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

// Reviewer/admin pages are unlisted, not just role-checked server-side — a
// PME account that finds the URL should never even see the shell render.
export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { isAuthenticated, roles: userRoles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/review/login" replace />;
  }
  if (!userRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
