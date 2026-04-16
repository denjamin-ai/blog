/**
 * global-setup.ts — запускается один раз перед всеми тестами.
 *
 * 1. Сбрасывает тестовую БД к начальному состоянию (seed)
 * 2. Логинится под каждой ролью и сохраняет storageState в testing/e2e/.auth/
 */

import { chromium, FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3001";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD_PLAIN ?? "dhome$32";

const AUTH_DIR = path.join(__dirname, ".auth");

async function globalSetup(_config: FullConfig) {
  // 1. Reset test DB to a clean seeded state
  console.log("[global-setup] Сброс тестовой БД...");
  try {
    execSync("bash .agents/playwright-tester/reset-test-db.sh", {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../../"),
    });
  } catch (e) {
    console.warn("[global-setup] Не удалось сбросить БД:", e);
    console.warn("[global-setup] Продолжаю с текущим состоянием БД...");
  }

  // 2. Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  // ── Admin ────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/admin/login`);
    await page
      .locator('input[autocomplete="current-password"]')
      .fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "admin.json") });
    await ctx.close();
    console.log("[global-setup] ✅ Admin auth saved");
  }

  // ── Reader ────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[autocomplete="username"]').fill("reader");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("password");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/reader`, { timeout: 10_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "reader.json") });
    await ctx.close();
    console.log("[global-setup] ✅ Reader auth saved");
  }

  // ── Author ────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[autocomplete="username"]').fill("author");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("password");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/author`, { timeout: 10_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "author.json") });
    await ctx.close();
    console.log("[global-setup] ✅ Author auth saved");
  }

  // ── Reviewer ──────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[autocomplete="username"]').fill("reviewer");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("password");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/reviewer`, { timeout: 10_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "reviewer.json") });
    await ctx.close();
    console.log("[global-setup] ✅ Reviewer auth saved");
  }

  await browser.close();
  console.log("[global-setup] Готово. Запускаю тесты...");
}

export default globalSetup;
