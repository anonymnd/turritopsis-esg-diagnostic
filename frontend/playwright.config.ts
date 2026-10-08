import {defineConfig,devices} from "@playwright/test";
if(!process.env.TURRITOPSIS_TEST_CONNECTION) throw new Error("Set TURRITOPSIS_TEST_CONNECTION to an isolated PostgreSQL test instance.");
export default defineConfig({
 testDir:"./e2e", fullyParallel:false, workers:1, timeout:60000,
 forbidOnly:!!process.env.CI, retries:process.env.CI?1:0,
 reporter:[["list"],["html",{open:"never"}]],
 use:{baseURL:"http://127.0.0.1:5175",trace:"retain-on-failure",screenshot:"only-on-failure"},
 projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
 webServer:[
  {command:"dotnet run --project ../backend/tests/Turritopsis.E2eHost --no-launch-profile",url:"http://127.0.0.1:5017/swagger/index.html",reuseExistingServer:false,timeout:180000},
  {command:"npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",url:"http://127.0.0.1:5175",reuseExistingServer:false,
   env:{VITE_API_BASE_URL:"http://127.0.0.1:5017/api/v1",VITE_FIREBASE_PROJECT_ID:""},timeout:120000}
 ]
});
