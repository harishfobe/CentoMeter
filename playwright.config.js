import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.e2e.js",
  workers: 1,
  projects: [
    {
      name: "phone",
      testIgnore: ["audit-flows.e2e.js", "home-discovery.e2e.js"],
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "audit-phone",
      testMatch: ["audit-flows.e2e.js", "home-discovery.e2e.js"],
      use: {
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
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
