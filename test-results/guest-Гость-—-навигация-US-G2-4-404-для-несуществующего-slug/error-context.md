# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guest.spec.ts >> Гость — навигация >> US-G2.4: 404 для несуществующего slug
- Location: testing/e2e/guest.spec.ts:50:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 200
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Перейти к содержимому" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "devblog" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - link "Блог" [ref=e7] [cursor=pointer]:
          - /url: /blog
        - button "Открыть руководство" [ref=e8]:
          - img [ref=e9]
        - button "Переключить на тёмную тему" [ref=e12]:
          - img [ref=e13]
        - link "Войти" [ref=e15] [cursor=pointer]:
          - /url: /login
  - main [ref=e16]:
    - generic [ref=e18]:
      - heading "404" [level=1] [ref=e19]
      - heading "This page could not be found." [level=2] [ref=e21]
  - contentinfo [ref=e22]:
    - generic [ref=e23]:
      - paragraph [ref=e24]: © 2026 Denjamin
      - generic [ref=e25]:
        - link "GitHub" [ref=e26] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e27] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e28]
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```

# Test source

```ts
  1  | /**
  2  |  * guest.spec.ts — тесты для неавторизованного пользователя
  3  |  *
  4  |  * US-G2: Навигация и чтение статьи
  5  |  * TC-GU-007: Guide modal (гостевой контент)
  6  |  */
  7  | 
  8  | import { test, expect } from "@playwright/test";
  9  | 
  10 | test.describe("Гость — навигация", () => {
  11 |   test("US-G2.1: /blog отображает список статей", async ({ page }) => {
  12 |     await page.goto("/blog");
  13 |     // Должны быть карточки статей
  14 |     const cards = page.locator("article, [class*='card'], a[href^='/blog/']");
  15 |     await expect(cards.first()).toBeVisible();
  16 |   });
  17 | 
  18 |   test("US-G2.2: клик по карточке открывает страницу статьи", async ({
  19 |     page,
  20 |   }) => {
  21 |     await page.goto("/blog");
  22 | 
  23 |     // Берём первую ссылку на статью
  24 |     const articleLink = page
  25 |       .locator("a[href^='/blog/']")
  26 |       .filter({ hasText: /.+/ })
  27 |       .first();
  28 |     const href = await articleLink.getAttribute("href");
  29 |     expect(href).toMatch(/^\/blog\/.+/);
  30 | 
  31 |     await articleLink.click();
  32 |     await page.waitForURL(/\/blog\/.+/);
  33 | 
  34 |     // На странице статьи должен быть заголовок h1
  35 |     await expect(page.locator("h1").first()).toBeVisible();
  36 |   });
  37 | 
  38 |   test("US-G2.3: страница статьи содержит контент", async ({ page }) => {
  39 |     // Открываем известную seed-статью
  40 |     await page.goto("/blog/typescript-utility-types");
  41 | 
  42 |     await expect(page.locator("h1").first()).toContainText("TypeScript");
  43 |     // Контент статьи (prose)
  44 |     const content = page.locator(
  45 |       "article, [class*='prose'], main .mdx-content",
  46 |     );
  47 |     await expect(content.first()).toBeVisible();
  48 |   });
  49 | 
  50 |   test("US-G2.4: 404 для несуществующего slug", async ({ page }) => {
  51 |     const response = await page.goto("/blog/this-slug-does-not-exist-99999");
> 52 |     expect(response?.status()).toBe(404);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  53 |   });
  54 | 
  55 |   test("US-G2.5: гость видит ссылку на вход для комментирования", async ({
  56 |     page,
  57 |   }) => {
  58 |     await page.goto("/blog/typescript-utility-types");
  59 |     // Должна быть ссылка «Войдите» или форма логина
  60 |     const loginLink = page.getByRole("link", { name: /войд|войти|вход/i });
  61 |     await expect(loginLink.first()).toBeVisible();
  62 |   });
  63 | 
  64 |   test("US-G2.6: / редиректит на /blog для гостя", async ({ page }) => {
  65 |     await page.goto("/");
  66 |     await page.waitForURL(/\/blog/, { timeout: 5_000 });
  67 |     expect(page.url()).toContain("/blog");
  68 |   });
  69 | });
  70 | 
  71 | // ── TC-GU-007: Guide modal ──────────────────────────────────────────────
  72 | 
  73 | test.describe("TC-GU-007: Руководство для гостя", () => {
  74 |   test("открыть guide modal и закрыть через Escape", async ({ page }) => {
  75 |     await page.goto("/blog");
  76 | 
  77 |     const guideBtn = page
  78 |       .locator('button[aria-label="Открыть руководство"]')
  79 |       .first();
  80 |     await expect(guideBtn).toBeVisible({ timeout: 5_000 });
  81 |     await guideBtn.click();
  82 | 
  83 |     const dialog = page.locator("dialog[open]");
  84 |     await expect(dialog).toBeVisible({ timeout: 3_000 });
  85 |     await expect(
  86 |       dialog.getByText("Возможности для гостей"),
  87 |     ).toBeVisible();
  88 |     await expect(
  89 |       dialog.getByText("Читайте статьи с удобным оглавлением"),
  90 |     ).toBeVisible();
  91 | 
  92 |     // Закрытие через Escape
  93 |     await page.keyboard.press("Escape");
  94 |     await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  95 |   });
  96 | });
  97 | 
```