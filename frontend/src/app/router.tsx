import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/landing/LandingPage";
import AuthPage from "../pages/auth/AuthPage";
import ReviewerLoginPage from "../pages/reviewer-login/ReviewerLoginPage";
import PmeLayout from "../pages/pme/PmeLayout";
import DashboardPage from "../pages/pme/dashboard/DashboardPage";
import CompanyInfoPage from "../pages/pme/company-info/CompanyInfoPage";
import QuestionnairePage from "../pages/pme/questionnaire/QuestionnairePage";
import ProofsPage from "../pages/pme/proofs/ProofsPage";
import AnalysisPage from "../pages/pme/analysis/AnalysisPage";
import ReportPage from "../pages/pme/report/ReportPage";
import ReviewerLayout from "../pages/reviewer/ReviewerLayout";
import QueuePage from "../pages/reviewer/queue/QueuePage";
import DossierDetailPage from "../pages/reviewer/detail/DossierDetailPage";
import AdminPage from "../pages/admin/AdminPage";
import RequireAuth from "./RequireAuth";
import RequireCompanyProfile from "./RequireCompanyProfile";
import RequireRole from "./RequireRole";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/review/login", element: <ReviewerLoginPage /> },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <PmeLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "company-info", element: <CompanyInfoPage /> },
      {
        path: "questionnaire",
        element: (
          <RequireCompanyProfile>
            <QuestionnairePage />
          </RequireCompanyProfile>
        )
      },
      {
        path: "proofs",
        element: (
          <RequireCompanyProfile>
            <ProofsPage />
          </RequireCompanyProfile>
        )
      },
      { path: "analysis", element: <AnalysisPage /> },
      { path: "report", element: <ReportPage /> }
    ]
  },
  {
    path: "/reviewer",
    element: (
      <RequireRole roles={["reviewer", "admin"]}>
        <ReviewerLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <QueuePage /> },
      { path: "dossiers/:dossierId", element: <DossierDetailPage /> },
      {
        path: "admin",
        element: (
          <RequireRole roles={["admin"]}>
            <AdminPage />
          </RequireRole>
        )
      }
    ]
  }
]);
