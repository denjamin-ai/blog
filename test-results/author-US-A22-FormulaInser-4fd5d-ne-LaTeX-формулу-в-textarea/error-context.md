# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: author.spec.ts >> US-A22: FormulaInserter >> вставить inline LaTeX-формулу в textarea
- Location: testing/e2e/author.spec.ts:99:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]').first()
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - link "Кабинет автора" [ref=e15] [cursor=pointer]:
          - /url: /author
        - button "Выйти" [ref=e17]
  - main [ref=e18]:
    - generic [ref=e19]:
      - navigation [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - link "Кабинет автора" [ref=e23] [cursor=pointer]:
              - /url: /author
            - generic [ref=e24]:
              - link "Мои статьи" [ref=e25] [cursor=pointer]:
                - /url: /author/articles
              - link "Профиль" [ref=e26] [cursor=pointer]:
                - /url: /author/profile
              - link "Уведомления" [ref=e27] [cursor=pointer]:
                - /url: /author/notifications
              - link "Сайт →" [ref=e28] [cursor=pointer]:
                - /url: /
          - button "Выйти" [ref=e30]
      - main [ref=e31]:
        - generic [ref=e32]:
          - heading "Новая статья" [level=1] [ref=e33]
          - generic [ref=e34]:
            - generic [ref=e35]:
              - generic [ref=e36]: Заголовок
              - textbox "Заголовок статьи" [ref=e37]
            - generic [ref=e38]:
              - generic [ref=e39]: Slug
              - textbox "url-slug" [ref=e40]
            - generic [ref=e41]:
              - generic [ref=e42]: Описание
              - textbox "Краткое описание для карточки" [ref=e43]
            - generic [ref=e44]:
              - generic [ref=e45]: Теги (через запятую)
              - textbox "react, typescript, nextjs" [ref=e46]
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]:
                - button "Диаграмма" [ref=e51]:
                  - img [ref=e52]
                  - text: Диаграмма
                - button "Формула" [active] [pressed] [ref=e57]:
                  - generic [ref=e58]: ∑
                  - text: Формула
                - button "Медиа" [ref=e60]:
                  - img [ref=e61]
                  - text: Медиа
              - generic [ref=e64]:
                - generic [ref=e65]: Предпросмотр
                - button "Без предпросмотра" [pressed] [ref=e66]:
                  - img [ref=e67]
                - button "Предпросмотр справа" [ref=e69]:
                  - img [ref=e70]
                - button "Предпросмотр слева" [ref=e72]:
                  - img [ref=e73]
                - button "Предпросмотр снизу" [ref=e75]:
                  - img [ref=e76]
            - generic [ref=e78]:
              - generic [ref=e79]:
                - button "Inline $...$" [pressed] [ref=e80]:
                  - text: Inline
                  - code [ref=e81]: $...$
                - button "Block $$...$$" [ref=e82]:
                  - text: Block
                  - code [ref=e83]: $$...$$
              - generic [ref=e84]:
                - button "∑" [ref=e85]
                - button "∫" [ref=e86]
                - button "√" [ref=e87]
                - button "∂" [ref=e88]
                - button "α" [ref=e89]
                - button "β" [ref=e90]
                - button "γ" [ref=e91]
                - button "θ" [ref=e92]
                - button "λ" [ref=e93]
                - button "π" [ref=e94]
                - button "Матрица" [ref=e95]
              - generic [ref=e96]:
                - generic [ref=e97]: LaTeX
                - textbox "E = mc^2" [ref=e98]
              - generic [ref=e99]:
                - button "Закрыть" [ref=e100]
                - button "Вставить формулу" [disabled] [ref=e101]
            - generic [ref=e103]:
              - generic [ref=e104]: Контент (MDX)
              - textbox "Текст статьи в формате MDX..." [ref=e106]
          - generic [ref=e108]:
            - button "Сохранить черновик" [disabled] [ref=e109]
            - button "Опубликовать" [disabled] [ref=e110]
  - contentinfo [ref=e111]:
    - generic [ref=e112]:
      - paragraph [ref=e113]: © 2026 Denjamin
      - generic [ref=e114]:
        - link "GitHub" [ref=e115] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e116] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e117]
  - button "Open Next.js Dev Tools" [ref=e125] [cursor=pointer]:
    - img [ref=e126]
  - alert [ref=e129]
```

# Test source

```ts
  46  |   test.use({ storageState: AUTH_FILE });
  47  | 
  48  |   test("автор создаёт черновик статьи", async ({ page }) => {
  49  |     await page.goto("/author/articles");
  50  | 
  51  |     // Найти кнопку «Новая статья»
  52  |     const newBtn = page
  53  |       .getByRole("button", { name: /новая статья|создать/i })
  54  |       .or(page.getByRole("link", { name: /новая статья|создать/i }));
  55  |     await expect(newBtn.first()).toBeVisible({ timeout: 5_000 });
  56  |     await newBtn.first().click();
  57  | 
  58  |     // Ждём перехода на форму/редактор (должен быть /new или /[id], не просто /articles)
  59  |     await page.waitForURL(/\/author\/articles\//, { timeout: 10_000 });
  60  | 
  61  |     // Заполнить заголовок
  62  |     const titleField = page.locator(
  63  |       'input[name="title"], input[placeholder*="заголов" i]',
  64  |     );
  65  |     await expect(titleField.first()).toBeVisible({ timeout: 5_000 });
  66  |     await titleField.first().fill("E2E черновик автора");
  67  | 
  68  |     // Slug
  69  |     const slugField = page.locator(
  70  |       'input[name="slug"], input[placeholder*="slug" i]',
  71  |     );
  72  |     if (await slugField.first().isVisible()) {
  73  |       await slugField.first().clear();
  74  |       await slugField.first().fill(`e2e-author-draft-${Date.now()}`);
  75  |     }
  76  | 
  77  |     // Контент
  78  |     const contentArea = page.locator("textarea").first();
  79  |     await contentArea.fill("## Тест\n\nСодержимое черновика.");
  80  | 
  81  |     // Сохранить черновик
  82  |     await page
  83  |       .getByRole("button", { name: /сохранить/i })
  84  |       .first()
  85  |       .click();
  86  | 
  87  |     // Должны остаться на странице редактора (не редирект на список)
  88  |     await page.waitForURL(/\/author\/articles\/.+/, { timeout: 10_000 });
  89  |     draftPageUrl = page.url();
  90  |     expect(draftPageUrl).toMatch(/\/author\/articles\/.+/);
  91  |   });
  92  | });
  93  | 
  94  | // ── US-A22: Вставка LaTeX-формулы ────────────────────────────────────────
  95  | 
  96  | test.describe("US-A22: FormulaInserter", () => {
  97  |   test.use({ storageState: AUTH_FILE });
  98  | 
  99  |   test("вставить inline LaTeX-формулу в textarea", async ({ page }) => {
  100 |     // Перейти на редактор (используем созданный черновик или создаём через API)
  101 |     if (!draftPageUrl) {
  102 |       const resp = await page.request.post("/api/articles", {
  103 |         data: {
  104 |           title: "E2E formula test",
  105 |           slug: `e2e-formula-${Date.now()}`,
  106 |           content: "## Formula",
  107 |           tags: [],
  108 |           status: "draft",
  109 |         },
  110 |         headers: { Origin: "http://localhost:3001" },
  111 |       });
  112 |       const json = await resp.json();
  113 |       draftPageUrl = `/author/articles/${json.id}`;
  114 |     }
  115 | 
  116 |     await page.goto(draftPageUrl);
  117 | 
  118 |     // Открыть панель FormulaInserter (коллапсируемая)
  119 |     const formulaToggle = page
  120 |       .getByRole("button", { name: /формул|formula/i })
  121 |       .or(page.locator('[data-testid="formula-inserter"]'))
  122 |       .first();
  123 | 
  124 |     if (
  125 |       !(await formulaToggle.isVisible({ timeout: 3_000 }).catch(() => false))
  126 |     ) {
  127 |       test.skip();
  128 |       return;
  129 |     }
  130 | 
  131 |     // Раскрыть панель если свёрнута
  132 |     const panelExpanded = await page
  133 |       .locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]')
  134 |       .first()
  135 |       .isVisible()
  136 |       .catch(() => false);
  137 | 
  138 |     if (!panelExpanded) {
  139 |       await formulaToggle.click();
  140 |     }
  141 | 
  142 |     // Ввести формулу
  143 |     const latexInput = page
  144 |       .locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]')
  145 |       .first();
> 146 |     await expect(latexInput).toBeVisible({ timeout: 3_000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  147 |     await latexInput.fill("x^2 + y^2 = r^2");
  148 | 
  149 |     // Вставить
  150 |     const insertBtn = page
  151 |       .getByRole("button", { name: /вставить|insert/i })
  152 |       .last();
  153 |     await insertBtn.click();
  154 | 
  155 |     // Проверить что в textarea появилась формула
  156 |     const contentArea = page.locator("textarea").first();
  157 |     const content = await contentArea.inputValue();
  158 |     expect(content).toContain("x^2");
  159 |   });
  160 | });
  161 | 
  162 | // ── US-A23: Live-preview ──────────────────────────────────────────────────
  163 | 
  164 | test.describe("US-A23: Live-preview", () => {
  165 |   test.use({ storageState: AUTH_FILE });
  166 | 
  167 |   test("preview обновляется при наборе MDX", async ({ page }) => {
  168 |     if (!draftPageUrl) {
  169 |       const resp = await page.request.post("/api/articles", {
  170 |         data: {
  171 |           title: "E2E preview test",
  172 |           slug: `e2e-preview-${Date.now()}`,
  173 |           content: "",
  174 |           tags: [],
  175 |           status: "draft",
  176 |         },
  177 |         headers: { Origin: "http://localhost:3001" },
  178 |       });
  179 |       const json = await resp.json();
  180 |       draftPageUrl = `/author/articles/${json.id}`;
  181 |     }
  182 | 
  183 |     await page.goto(draftPageUrl);
  184 | 
  185 |     // Включить split-режим (кнопка «Справа» или «Слева»)
  186 |     const splitBtn = page
  187 |       .getByRole("button", { name: /справа|слева|split|preview/i })
  188 |       .first();
  189 | 
  190 |     if (!(await splitBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
  191 |       test.skip();
  192 |       return;
  193 |     }
  194 |     await splitBtn.click();
  195 | 
  196 |     // Очистить textarea и ввести MDX
  197 |     const contentArea = page.locator("textarea").first();
  198 |     await contentArea.clear();
  199 |     const uniqueHeading = `Тест превью ${Date.now()}`;
  200 |     await contentArea.fill(`## ${uniqueHeading}`);
  201 | 
  202 |     // Ждём debounce (500ms) + запрос к /api/preview
  203 |     await page.waitForTimeout(1_200);
  204 | 
  205 |     // Preview-панель должна содержать h2 с текстом
  206 |     const preview = page.locator(
  207 |       '[class*="preview"], [data-testid="preview"], .prose',
  208 |     );
  209 |     await expect(
  210 |       preview.locator("h2").filter({ hasText: uniqueHeading }),
  211 |     ).toBeVisible({ timeout: 8_000 });
  212 |   });
  213 | });
  214 | 
  215 | // ── US-G11: Диаграмма рендерится ─────────────────────────────────────────
  216 | 
  217 | test.describe("US-G11: Mermaid-диаграмма", () => {
  218 |   test.use({ storageState: AUTH_FILE });
  219 | 
  220 |   test("Mermaid chart рендерится как SVG на публичной странице", async ({
  221 |     page,
  222 |   }) => {
  223 |     const diagramSlug = `e2e-mermaid-${Date.now()}`;
  224 | 
  225 |     // Создать и опубликовать статью с Mermaid через API
  226 |     const createResp = await page.request.post("/api/articles", {
  227 |       data: {
  228 |         title: "E2E диаграмма тест",
  229 |         slug: diagramSlug,
  230 |         content: '<Mermaid chart="graph TD; A[Старт] --> B[Конец];" />',
  231 |         tags: [],
  232 |         status: "draft",
  233 |       },
  234 |       headers: { Origin: "http://localhost:3001" },
  235 |     });
  236 | 
  237 |     if (!createResp.ok()) {
  238 |       test.skip();
  239 |       return;
  240 |     }
  241 | 
  242 |     const { id } = await createResp.json();
  243 | 
  244 |     // Публикуем через PUT
  245 |     const pubResp = await page.request.put(`/api/articles/${id}`, {
  246 |       data: {
```