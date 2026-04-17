# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> US-AD1: Вход администратора >> неверный пароль — ошибка, редиректа нет
- Location: testing/e2e/admin.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('p.text-red-500, [class*=\'error\']')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('p.text-red-500, [class*=\'error\']')

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
      - paragraph [ref=e19]: devblog
      - heading "Вход в админку" [level=1] [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Пароль
          - textbox "Пароль" [ref=e24]: wrong-password
        - paragraph [ref=e25]: Неверный пароль
        - button "Войти" [ref=e26]
  - contentinfo [ref=e27]:
    - generic [ref=e28]:
      - paragraph [ref=e29]: © 2026 Denjamin
      - generic [ref=e30]:
        - link "GitHub" [ref=e31] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e32] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e33]
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]:
    - img [ref=e42]
  - alert [ref=e45]
```

# Test source

```ts
  1   | /**
  2   |  * admin.spec.ts — тесты для администратора
  3   |  *
  4   |  * US-AD1: Вход администратора
  5   |  * US-AD4: Создание статьи (MDX)
  6   |  * US-AD5: Редактирование + сохранение
  7   |  * US-AD6: Публикация / снятие с публикации
  8   |  * TC-AD-030: Создание review session с 2 ревьюерами
  9   |  * TC-AD-031: Руководство (guide modal)
  10  |  */
  11  | 
  12  | import { test, expect } from "@playwright/test";
  13  | import * as path from "path";
  14  | 
  15  | const AUTH_FILE = path.join(__dirname, ".auth/admin.json");
  16  | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD_PLAIN ?? "dhome$32";
  17  | 
  18  | // Shared state между тестами AD4 → AD5 → AD6
  19  | let createdArticleUrl = "";
  20  | const TEST_SLUG = `e2e-admin-test-${Date.now()}`;
  21  | 
  22  | // ── US-AD1: Вход ──────────────────────────────────────────────────────────
  23  | 
  24  | test.describe("US-AD1: Вход администратора", () => {
  25  |   test("успешный вход с верным паролем", async ({ page }) => {
  26  |     await page.goto("/admin/login");
  27  |     await expect(
  28  |       page.getByRole("heading", { name: /вход в админку/i }),
  29  |     ).toBeVisible();
  30  | 
  31  |     await page
  32  |       .locator('input[autocomplete="current-password"]')
  33  |       .fill(ADMIN_PASSWORD);
  34  |     await page.locator('button[type="submit"]').click();
  35  |     await page.waitForURL(/\/admin$/, { timeout: 10_000 });
  36  | 
  37  |     // Убедились что попали в дашборд
  38  |     expect(page.url()).toContain("/admin");
  39  |   });
  40  | 
  41  |   test("неверный пароль — ошибка, редиректа нет", async ({ page }) => {
  42  |     await page.goto("/admin/login");
  43  |     await page
  44  |       .locator('input[autocomplete="current-password"]')
  45  |       .fill("wrong-password");
  46  |     await page.locator('button[type="submit"]').click();
  47  | 
  48  |     // Остаёмся на /admin/login
  49  |     await page.waitForTimeout(1_000);
  50  |     expect(page.url()).toContain("/admin/login");
  51  |     // Должно быть сообщение об ошибке
  52  |     await expect(
  53  |       page.locator("p.text-red-500, [class*='error']"),
> 54  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  55  |   });
  56  | 
  57  |   test("защищённые роуты без сессии редиректят на /admin/login", async ({
  58  |     page,
  59  |   }) => {
  60  |     // Чистый контекст — нет cookies
  61  |     const response = await page.goto("/admin");
  62  |     // Должен быть редирект (307 или 302) → /admin/login
  63  |     expect(page.url()).toContain("/admin/login");
  64  |     // Финальный статус страницы логина — 200
  65  |     expect(response?.status()).toBe(200);
  66  |   });
  67  | });
  68  | 
  69  | // ── US-AD4: Создание статьи ───────────────────────────────────────────────
  70  | 
  71  | test.describe("US-AD4: Создание статьи", () => {
  72  |   test.use({ storageState: AUTH_FILE });
  73  | 
  74  |   test("создать MDX-черновик через форму", async ({ page }) => {
  75  |     await page.goto("/admin/articles/new");
  76  | 
  77  |     // Заполняем заголовок
  78  |     await page
  79  |       .locator('input[name="title"], input[placeholder*="заголов" i]')
  80  |       .fill("E2E тест — создание статьи");
  81  | 
  82  |     // Slug (может авто-заполниться, если нет — заполняем вручную)
  83  |     const slugField = page.locator(
  84  |       'input[name="slug"], input[placeholder*="slug" i]',
  85  |     );
  86  |     const slugValue = await slugField.inputValue();
  87  |     if (!slugValue) {
  88  |       await slugField.fill(TEST_SLUG);
  89  |     } else {
  90  |       // Сохраним авто-slug
  91  |       await slugField.clear();
  92  |       await slugField.fill(TEST_SLUG);
  93  |     }
  94  | 
  95  |     // Контент MDX
  96  |     const contentArea = page.locator("textarea").first();
  97  |     await contentArea.fill("## Заголовок\n\nТестовый параграф.");
  98  | 
  99  |     // Сохранить как черновик
  100 |     await page
  101 |       .getByRole("button", { name: /сохранить/i })
  102 |       .first()
  103 |       .click();
  104 | 
  105 |     // Ожидаем редирект на страницу редактирования (ID, не /new)
  106 |     await page.waitForURL(/\/admin\/articles\/(?!new)[^/]+/, {
  107 |       timeout: 10_000,
  108 |     });
  109 |     createdArticleUrl = page.url();
  110 |     expect(createdArticleUrl).toMatch(/\/admin\/articles\/(?!new)[^/]+/);
  111 |   });
  112 | });
  113 | 
  114 | // ── US-AD5: Редактирование ────────────────────────────────────────────────
  115 | 
  116 | test.describe("US-AD5: Редактирование статьи", () => {
  117 |   test.use({ storageState: AUTH_FILE });
  118 | 
  119 |   test("изменить заголовок и сохранить", async ({ page }) => {
  120 |     // Если createdArticleUrl пустой — создаём временную статью через API
  121 |     if (!createdArticleUrl) {
  122 |       const resp = await page.request.post("/api/articles", {
  123 |         data: {
  124 |           title: "E2E temp article",
  125 |           slug: `e2e-temp-${Date.now()}`,
  126 |           content: "## Test",
  127 |           tags: [],
  128 |           status: "draft",
  129 |         },
  130 |         headers: { Origin: "http://localhost:3001" },
  131 |       });
  132 |       const json = await resp.json();
  133 |       createdArticleUrl = `/admin/articles/${json.id}`;
  134 |     }
  135 | 
  136 |     await page.goto(createdArticleUrl);
  137 | 
  138 |     const titleField = page.locator(
  139 |       'input[name="title"], input[placeholder*="заголов" i]',
  140 |     );
  141 |     await titleField.clear();
  142 |     await titleField.fill("E2E тест — отредактированный заголовок");
  143 | 
  144 |     // Ожидаем PUT-ответ и клик одновременно
  145 |     const [putResponse] = await Promise.all([
  146 |       page.waitForResponse(
  147 |         (res) =>
  148 |           res.url().includes("/api/articles/") &&
  149 |           res.request().method() === "PUT",
  150 |         { timeout: 8_000 },
  151 |       ),
  152 |       page
  153 |         .getByRole("button", { name: /сохранить/i })
  154 |         .first()
```