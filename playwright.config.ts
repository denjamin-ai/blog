import { defineConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Load .env.test if it exists
const envTestPath = path.resolve(__dirname, ".env.test");
if (fs.existsSync(envTestPath)) {
  const lines = fs.readFileSync(envTestPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    // Don't override already-set vars
    if (!(key in process.env)) {
      let value = trimmed.slice(idx + 1).trim();
      // Strip surrounding single or double quotes (dotenv convention)
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  testDir: "./testing/e2e",

  // Run tests sequentially — single test DB
  workers: 1,
  fullyParallel: false,

  // Retry once on CI, no retries locally
  retries: process.env.CI ? 1 : 0,

  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "testing/reports/playwright-html",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    video: "on-first-retry",
    // Capture screenshot on failure
    screenshot: "only-on-failure",
  },

  globalSetup: "./testing/e2e/global-setup.ts",

  webServer: {
    command: "npm run dev:test",
    url: "http://localhost:3001",
    // Reuse server if already running (typical dev workflow)
    reuseExistingServer: true,
    timeout: 60_000,
    stderr: "pipe",
  },
});
