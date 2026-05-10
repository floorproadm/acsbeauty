import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for ACS Beauty E2E.
 *
 * Run with:
 *   BASE_URL=http://localhost:8080 bunx playwright test
 *
 * Defaults to the Lovable preview URL when BASE_URL is not provided.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "https://acsbeauty.lovable.app",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-iphone12", use: { ...devices["iPhone 12"] } },
    { name: "mobile-pixel5", use: { ...devices["Pixel 5"] } },
    { name: "tablet-ipad", use: { ...devices["iPad (gen 7)"] } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
