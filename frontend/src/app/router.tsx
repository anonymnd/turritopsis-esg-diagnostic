import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/public";
import { companyRoutes } from "./routes/company";
import { reviewRoutes } from "./routes/review";
export const router = createBrowserRouter([...publicRoutes, ...companyRoutes, ...reviewRoutes]);
