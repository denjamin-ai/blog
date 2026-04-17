/**
 * guest.spec.ts — тесты для неавторизованного пользователя
 *
 * US-G2: Навигация и чтение статьи
 * TC-GU-007: Guide modal (гостевой контент)
 */

import { test, expect } from "@playwright/test";

test.describe("Гость — навигация", () => {
  test("US-G2.1: /blog отображает список статей", async ({ page }) => {
    await page.goto("/blog");
    // Должны быть карточки статей
    const cards = page.locator("article, [class*='card'], a[href^='/blog/']");
    await expect(cards.first()).toBeVisible();
  });

  test("US-G2.2: клик по карточке открывает страницу статьи", async ({
    page,
  }) => {
    await page.goto("/blog");

    // Берём первую ссылку на статью
    const articleLink = page
      .locator("a[href^='/blog/']")
      .filter({ hasText: /.+/ })
      .first();
    const href = await articleLink.getAttribute("href");
    expect(href).toMatch(/^\/blog\/.+/);

    await articleLink.click();
    await page.waitForURL(/\/blog\/.+/);

    // На странице статьи должен быть заголовок h1
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("US-G2.3: страница статьи содержит контент", async ({ page }) => {
    // Открываем известную seed-статью
    await page.goto("/blog/typescript-utility-types");

    await expect(page.locator("h1").first()).toContainText("TypeScript");
    // Контент статьи (prose)
    const content = page.locator(
      "article, [class*='prose'], main .mdx-content",
    );
    await expect(content.first()).toBeVisible();
  });

  test("US-G2.4: 404 для несуществующего slug", async ({ page }) => {
    const response = await page.goto("/blog/this-slug-does-not-exist-99999");
    expect(response?.status()).toBe(404);
  });

  test("US-G2.5: гость видит ссылку на вход для комментирования", async ({
    page,
  }) => {
    await page.goto("/blog/typescript-utility-types");
    // Должна быть ссылка «Войдите» или форма логина
    const loginLink = page.getByRole("link", { name: /войд|войти|вход/i });
    await expect(loginLink.first()).toBeVisible();
  });

  test("US-G2.6: / редиректит на /blog для гостя", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/blog/, { timeout: 5_000 });
    expect(page.url()).toContain("/blog");
  });
});

// ── TC-GU-007: Guide modal ──────────────────────────────────────────────

test.describe("TC-GU-007: Руководство для гостя", () => {
  test("открыть guide modal и закрыть через Escape", async ({ page }) => {
    await page.goto("/blog");

    const guideBtn = page
      .locator('button[aria-label="Открыть руководство"]')
      .first();
    await expect(guideBtn).toBeVisible({ timeout: 5_000 });
    await guideBtn.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(
      dialog.getByText("Возможности для гостей"),
    ).toBeVisible();
    await expect(
      dialog.getByText("Читайте статьи с удобным оглавлением"),
    ).toBeVisible();

    // Закрытие через Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
