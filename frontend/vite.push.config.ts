import { defineConfig } from "vite";
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "public",
    emptyOutDir: false,
    lib: { entry: "src/features/notifications/firebase-messaging-sw.ts", name: "TurritopsisPushWorker", formats: ["iife"], fileName: () => "firebase-messaging-sw.js" }
  }
});
