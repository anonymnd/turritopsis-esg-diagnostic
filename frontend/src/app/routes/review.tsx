import type { RouteObject } from "react-router-dom";
import RequireRole from "../RequireRole";
import ReviewerLayout from "../layouts/review/ReviewerLayout";
import { adminRoutes } from "./admin";
export const reviewRoutes: RouteObject[] = [{
  path: "/reviewer", element: <RequireRole roles={["reviewer", "admin"]}><ReviewerLayout /></RequireRole>, children: [
    { index: true, lazy: async () => ({ Component: (await import("../../features/review/pages/queue/QueuePage")).default }) },
    { path: "all", lazy: async () => { const { default: QueuePage } = await import("../../features/review/pages/queue/QueuePage"); return { Component: () => <QueuePage all /> }; } },
    { path: "dossiers/:dossierId", lazy: async () => ({ Component: (await import("../../features/review/pages/detail/DossierDetailPage")).default }) },
    ...adminRoutes
  ]
}];
