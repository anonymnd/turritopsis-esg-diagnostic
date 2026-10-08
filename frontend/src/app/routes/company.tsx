import type { RouteObject } from "react-router-dom";
import RequireAuth from "../RequireAuth";
import RequireCompanyProfile from "../RequireCompanyProfile";
import PmeLayout from "../layouts/company/PmeLayout";
import { Outlet } from "react-router-dom";
export const companyRoutes: RouteObject[] = [{
  path: "/app", element: <RequireAuth><PmeLayout /></RequireAuth>, children: [
    { index: true, lazy: async () => ({ Component: (await import("../../features/company/pages/dashboard/DashboardPage")).default }) },
    { path: "company-info", lazy: async () => ({ Component: (await import("../../features/company/pages/company-info/CompanyInfoPage")).default }) },
    { element: <RequireCompanyProfile><Outlet /></RequireCompanyProfile>, children: [
      { path: "questionnaire", lazy: async () => ({ Component: (await import("../../features/questionnaire/pages/QuestionnairePage")).default }) },
      { path: "proofs", lazy: async () => ({ Component: (await import("../../features/documents/pages/ProofsPage")).default }) }
    ] },
    { path: "analysis", lazy: async () => ({ Component: (await import("../../features/dossiers/pages/analysis/AnalysisPage")).default }) },
    { path: "report", lazy: async () => ({ Component: (await import("../../features/dossiers/pages/report/ReportPage")).default }) }
  ]
}];
