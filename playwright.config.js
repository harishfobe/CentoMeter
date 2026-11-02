import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.e2e.js",
  workers: 1,
  projects: [
    {
      name: "desktop",
      testIgnore: "audit-flows.e2e.js",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      testIgnore: "audit-flows.e2e.js",
      use: {
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "phone",
      testIgnore: "audit-flows.e2e.js",
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "audit-phone",
      testMatch: "audit-flows.e2e.js",
      use: {
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "audit-desktop",
      testMatch: "audit-flows.e2e.js",
      use: { viewport: { width: 1280, height: 900 } },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
