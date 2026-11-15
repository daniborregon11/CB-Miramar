import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  // serviceWorkers "block": sin modo sin conexión salvo en las pruebas que lo activan (pwa.spec.js)
  use: { baseURL: "http://localhost:4173", viewport: { width: 1280, height: 800 }, trace: "off", serviceWorkers: "block" },
  webServer: { command: "npm run build && npx vite preview --port 4173 --strictPort", port: 4173, reuseExistingServer: false },
});
