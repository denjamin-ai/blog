# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> US-AD4: Создание статьи >> создать MDX-черновик через форму
- Location: testing/e2e/admin.spec.ts:74:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="title"], input[placeholder*="заголов" i]')

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
        - link "Админка" [ref=e15] [cursor=pointer]:
          - /url: /admin
        - button "Выйти" [ref=e17]
  - main [ref=e18]:
    - generic [ref=e19]:
      - navigation [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - link "Админка" [ref=e23] [cursor=pointer]:
              - /url: /admin
            - generic [ref=e24]:
              - link "Статьи" [ref=e25] [cursor=pointer]:
                - /url: /admin/articles
              - link "Пользователи" [ref=e26] [cursor=pointer]:
                - /url: /admin/users
              - link "Уведомления" [ref=e27] [cursor=pointer]:
                - /url: /admin/notifications
              - link "Настройки" [ref=e28] [cursor=pointer]:
                - /url: /admin/settings
              - link "Сайт →" [ref=e29] [cursor=pointer]:
                - /url: /
          - button "Выйти" [ref=e31]
      - main [ref=e32]:
        - paragraph [ref=e33]: Не найдено
  - contentinfo [ref=e34]:
    - generic [ref=e35]:
      - paragraph [ref=e36]: © 2026 Denjamin
      - generic [ref=e37]:
        - link "GitHub" [ref=e38] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e39] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e40]
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]
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
  54  |     ).toBeVisible();
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
> 80  |       .fill("E2E тест — создание статьи");
      |        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  155 |         .click(),
  156 |     ]);
  157 | 
  158 |     // Убеждаемся что сохранение прошло успешно
  159 |     expect(putResponse.status()).toBe(200);
  160 |   });
  161 | });
  162 | 
  163 | // ── US-AD6: Публикация / снятие ───────────────────────────────────────────
  164 | 
  165 | test.describe("US-AD6: Публикация и снятие статьи", () => {
  166 |   test.use({ storageState: AUTH_FILE });
  167 | 
  168 |   test("опубликовать черновик", async ({ page }) => {
  169 |     if (!createdArticleUrl) {
  170 |       const resp = await page.request.post("/api/articles", {
  171 |         data: {
  172 |           title: "E2E publish test",
  173 |           slug: `e2e-pub-${Date.now()}`,
  174 |           content: "## Pub test",
  175 |           tags: [],
  176 |           status: "draft",
  177 |         },
  178 |         headers: { Origin: "http://localhost:3001" },
  179 |       });
  180 |       const json = await resp.json();
```