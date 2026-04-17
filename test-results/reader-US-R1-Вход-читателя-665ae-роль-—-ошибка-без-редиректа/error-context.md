# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reader.spec.ts >> US-R1: Вход читателя >> неверный пароль — ошибка без редиректа
- Location: testing/e2e/reader.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('p[class*=\'red\'], [class*=\'error\'], .error')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('p[class*=\'red\'], [class*=\'error\'], .error')

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
      - heading "Вход в аккаунт" [level=1] [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Никнейм
          - textbox "Никнейм" [ref=e24]:
            - /placeholder: nickname
            - text: reader
        - generic [ref=e25]:
          - generic [ref=e26]: Пароль
          - textbox "Пароль" [ref=e27]:
            - /placeholder: ••••••••
            - text: wrong-password
        - paragraph [ref=e28]: Неверный никнейм или пароль
        - button "Войти" [ref=e29]
      - paragraph [ref=e30]: Аккаунты создаются администратором блога.
  - contentinfo [ref=e31]:
    - generic [ref=e32]:
      - paragraph [ref=e33]: © 2026 Denjamin
      - generic [ref=e34]:
        - link "GitHub" [ref=e35] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e36] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e37]
  - button "Open Next.js Dev Tools" [ref=e45] [cursor=pointer]:
    - img [ref=e46]
  - alert [ref=e49]
```

# Test source

```ts
  1   | /**
  2   |  * reader.spec.ts — тесты для читателя
  3   |  *
  4   |  * US-R1: Вход читателя
  5   |  * US-R2: Комментарий к статье
  6   |  * US-R8: Голосование за статью (P2)
  7   |  * US-R9: Закладки (P2)
  8   |  * TC-RD-010: Guide modal (P1)
  9   |  */
  10  | 
  11  | import { test, expect } from "@playwright/test";
  12  | import * as path from "path";
  13  | 
  14  | const AUTH_FILE = path.join(__dirname, ".auth/reader.json");
  15  | const ARTICLE_SLUG = "typescript-utility-types";
  16  | 
  17  | // ── US-R1: Вход ───────────────────────────────────────────────────────────
  18  | 
  19  | test.describe("US-R1: Вход читателя", () => {
  20  |   test("успешный вход — редирект на /reader", async ({ page }) => {
  21  |     await page.goto("/login");
  22  |     await page.locator('input[autocomplete="username"]').fill("reader");
  23  |     await page
  24  |       .locator('input[autocomplete="current-password"]')
  25  |       .fill("password");
  26  |     await page.locator('button[type="submit"]').click();
  27  | 
  28  |     await page.waitForURL(/\/reader/, { timeout: 10_000 });
  29  |     expect(page.url()).toContain("/reader");
  30  |   });
  31  | 
  32  |   test("неверный пароль — ошибка без редиректа", async ({ page }) => {
  33  |     await page.goto("/login");
  34  |     await page.locator('input[autocomplete="username"]').fill("reader");
  35  |     await page
  36  |       .locator('input[autocomplete="current-password"]')
  37  |       .fill("wrong-password");
  38  |     await page.locator('button[type="submit"]').click();
  39  | 
  40  |     await page.waitForTimeout(1_000);
  41  |     expect(page.url()).toContain("/login");
  42  |     await expect(
  43  |       page.locator("p[class*='red'], [class*='error'], .error"),
> 44  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  45  |   });
  46  | });
  47  | 
  48  | // ── US-R2: Комментарий ────────────────────────────────────────────────────
  49  | 
  50  | test.describe("US-R2: Оставить комментарий", () => {
  51  |   test.use({ storageState: AUTH_FILE });
  52  | 
  53  |   test("читатель может оставить комментарий к статье", async ({ page }) => {
  54  |     await page.goto(`/blog/${ARTICLE_SLUG}`);
  55  | 
  56  |     // Найти форму комментария
  57  |     const commentArea = page.locator(
  58  |       "textarea[placeholder], textarea[name*='comment' i], textarea",
  59  |     );
  60  |     await expect(commentArea.first()).toBeVisible({ timeout: 5_000 });
  61  | 
  62  |     const uniqueText = `E2E тест комментарий ${Date.now()}`;
  63  |     await commentArea.first().fill(uniqueText);
  64  | 
  65  |     // Отправить
  66  |     await page
  67  |       .getByRole("button", { name: /отправить|добавить|написать/i })
  68  |       .first()
  69  |       .click();
  70  | 
  71  |     // Комментарий должен появиться на странице
  72  |     await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 8_000 });
  73  |   });
  74  | 
  75  |   test("вложенный комментарий (ответ)", async ({ page }) => {
  76  |     await page.goto(`/blog/${ARTICLE_SLUG}`);
  77  | 
  78  |     // Добавить родительский комментарий
  79  |     const commentArea = page.locator("textarea").first();
  80  |     await expect(commentArea).toBeVisible();
  81  |     const parentText = `E2E родитель ${Date.now()}`;
  82  |     await commentArea.fill(parentText);
  83  |     await page
  84  |       .getByRole("button", { name: /отправить|добавить/i })
  85  |       .first()
  86  |       .click();
  87  |     await expect(page.getByText(parentText)).toBeVisible({ timeout: 8_000 });
  88  | 
  89  |     // Нажать «Ответить» у этого комментария
  90  |     const commentBlock = page
  91  |       .locator("[class*='comment'], article")
  92  |       .filter({ hasText: parentText });
  93  |     const replyBtn = commentBlock.getByRole("button", { name: /ответить/i });
  94  |     if (await replyBtn.isVisible()) {
  95  |       await replyBtn.click();
  96  |       const replyText = `E2E ответ ${Date.now()}`;
  97  |       const replyArea = page.locator("textarea").last();
  98  |       await replyArea.fill(replyText);
  99  |       await page
  100 |         .getByRole("button", { name: /отправить|добавить/i })
  101 |         .last()
  102 |         .click();
  103 |       await expect(page.getByText(replyText)).toBeVisible({ timeout: 8_000 });
  104 |     }
  105 |     // Если кнопки «Ответить» нет — тест пропускается как N/A
  106 |   });
  107 | });
  108 | 
  109 | // ── US-R8: Голосование ────────────────────────────────────────────────────
  110 | 
  111 | test.describe("US-R8: Голосование за статью", () => {
  112 |   test.use({ storageState: AUTH_FILE });
  113 | 
  114 |   test("читатель может поставить лайк статье", async ({ page }) => {
  115 |     await page.goto(`/blog/${ARTICLE_SLUG}`);
  116 | 
  117 |     // Найти кнопку upvote (aria-label или текст)
  118 |     const voteBtn = page
  119 |       .locator(
  120 |         'button[aria-label*="голос" i], button[aria-label*="vote" i], button[aria-label*="лайк" i]',
  121 |       )
  122 |       .or(page.getByRole("button", { name: /👍|▲|\+1|лайк/i }))
  123 |       .first();
  124 | 
  125 |     if (!(await voteBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
  126 |       test.skip(); // кнопки нет — N/A
  127 |       return;
  128 |     }
  129 | 
  130 |     // Запомнить текущее значение счётчика рядом с кнопкой
  131 |     const countBefore = await voteBtn
  132 |       .locator("..")
  133 |       .innerText()
  134 |       .catch(() => "");
  135 | 
  136 |     await voteBtn.click();
  137 |     await page.waitForTimeout(500);
  138 | 
  139 |     // Состояние кнопки должно измениться (aria-pressed, класс или счётчик)
  140 |     const countAfter = await voteBtn
  141 |       .locator("..")
  142 |       .innerText()
  143 |       .catch(() => "");
  144 |     // Достаточно что запрос прошёл без 4xx — проверим через request API
```