import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCompany } from "../features/company/useCompany";

// Questionnaire/Proofs need a complete company profile first — a dossier
// built on an empty "who is this company" section isn't useful to a
// reviewer. Redirects to the company-info form, remembering where to
// send the user back once it's filled in.
export default function RequireCompanyProfile({ children }: { children: ReactNode }) {
  const { data: company, isPending } = useCompany();
  const location = useLocation();

  if (isPending) return null;
  if (company && !company.isProfileComplete) {
    return <Navigate to={`/app/company-info?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
