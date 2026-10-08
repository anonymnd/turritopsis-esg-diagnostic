import type { RouteObject } from "react-router-dom";
import RequireRole from "../RequireRole";
import AdminLayout from "../../features/admin/pages/AdminLayout";
export const adminRoutes: RouteObject[] = [{
  path: "admin", element: <RequireRole roles={["admin"]}><AdminLayout /></RequireRole>, children: [
    { index: true, lazy: async () => ({ Component: (await import("../../features/admin/pages/OverviewPage")).default }) },
    { path: "reviewers", lazy: async () => ({ Component: (await import("../../features/admin/pages/ReviewersPage")).default }) },
    { path: "companies", lazy: async () => ({ Component: (await import("../../features/admin/pages/CompaniesPage")).default }) }
  ]
}];
