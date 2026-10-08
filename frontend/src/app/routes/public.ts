import type { RouteObject } from "react-router-dom";
export const publicRoutes: RouteObject[] = [
  { path: "/", lazy: async () => ({ Component: (await import("../../features/public/pages/LandingPage")).default }) },
  { path: "/auth", lazy: async () => ({ Component: (await import("../../features/auth/pages/AuthPage")).default }) },
  { path: "/auth/reset-password", lazy: async () => ({ Component: (await import("../../features/auth/pages/reset-password/ResetPasswordPage")).default }) },
  { path: "/review/login", lazy: async () => ({ Component: (await import("../../features/auth/pages/reviewer-login/ReviewerLoginPage")).default }) }
];
