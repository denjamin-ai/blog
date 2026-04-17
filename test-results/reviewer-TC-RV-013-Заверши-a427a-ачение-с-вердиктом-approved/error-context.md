# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reviewer.spec.ts >> TC-RV-013: Завершить ревью с вердиктом >> завершить accepted-назначение с вердиктом approved
- Location: testing/e2e/reviewer.spec.ts:161:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('radio', { name: /одобрить|approved/i }).or(locator('input[value="approved"]')).or(getByText(/одобрить|approved/i).first())
Expected: visible
Error: strict mode violation: getByRole('radio', { name: /одобрить|approved/i }).or(locator('input[value="approved"]')).or(getByText(/одобрить|approved/i).first()) resolved to 2 elements:
    1) <li class="flex items-start gap-2 text-sm">…</li> aka getByText('Выносите вердикт: approved,').first()
    2) <input type="radio" name="verdict" class="sr-only" value="approved"/> aka getByRole('radio', { name: '✅ Одобрено' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('radio', { name: /одобрить|approved/i }).or(locator('input[value="approved"]')).or(getByText(/одобрить|approved/i).first())

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
        - link "Кабинет ревьюера" [ref=e15] [cursor=pointer]:
          - /url: /reviewer
        - button "Выйти" [ref=e17]
  - main [ref=e18]:
    - generic [ref=e19]:
      - navigation [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - link "Ревью" [ref=e23] [cursor=pointer]:
              - /url: /reviewer
            - generic [ref=e24]:
              - link "Назначения" [ref=e25] [cursor=pointer]:
                - /url: /reviewer/assignments
              - link "Уведомления" [ref=e26] [cursor=pointer]:
                - /url: /reviewer/notifications
          - button "Выйти" [ref=e28]
      - main [ref=e29]:
        - link "История версий" [ref=e31] [cursor=pointer]:
          - /url: /reviewer/assignments/01KPBXZFNWSZVM3GWGPJZ8TE6V/versions
        - generic [ref=e32]:
          - generic [ref=e33]:
            - generic [ref=e34]:
              - button "Статья" [ref=e35]
              - button "Изменения" [ref=e36]
            - generic [ref=e37]:
              - heading "E2E author review session" [level=1] [ref=e38]
              - article [ref=e39]:
                - heading "Контент для ревью" [level=2] [ref=e40]
                - paragraph [ref=e41]: Тестовый параграф.
          - complementary [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: Принято
              - generic [ref=e45]:
                - button "Завершить" [active] [ref=e46]
                - button "Отклонить" [ref=e47]
            - group [ref=e48]:
              - generic "Участники сессии (1) ▼" [ref=e49] [cursor=pointer]:
                - generic [ref=e50]: Участники сессии (1)
                - generic [ref=e51]: ▼
            - generic [ref=e52]:
              - paragraph [ref=e54]: Общий чат сессии
              - generic [ref=e56]:
                - paragraph [ref=e58]: Нет комментариев
                - generic [ref=e59]:
                  - textbox "Добавить комментарий в общий чат…" [ref=e60]
                  - button "Отправить" [disabled] [ref=e61]
          - generic [ref=e63]:
            - heading "Завершить ревью" [level=2] [ref=e64]
            - generic [ref=e65]:
              - generic [ref=e66]:
                - paragraph [ref=e67]: Результат ревью
                - generic [ref=e68]:
                  - generic [ref=e69] [cursor=pointer]:
                    - radio "✅ Одобрено" [ref=e70]
                    - generic [ref=e71]: ✅
                    - generic [ref=e72]: Одобрено
                  - generic [ref=e73] [cursor=pointer]:
                    - radio "⚠️ Требует доработки" [ref=e74]
                    - generic [ref=e75]: ⚠️
                    - generic [ref=e76]: Требует доработки
                  - generic [ref=e77] [cursor=pointer]:
                    - radio "❌ Отклонено" [ref=e78]
                    - generic [ref=e79]: ❌
                    - generic [ref=e80]: Отклонено
              - generic [ref=e81]:
                - generic [ref=e82]: Резюме ревью (опционально)
                - textbox "Общий комментарий к ревью…" [ref=e83]
                - paragraph [ref=e84]: 0/1000
              - generic [ref=e85]:
                - button "Отмена" [ref=e86]
                - button "Подтвердить" [disabled] [ref=e87]
  - contentinfo [ref=e88]:
    - generic [ref=e89]:
      - paragraph [ref=e90]: © 2026 Denjamin
      - generic [ref=e91]:
        - link "GitHub" [ref=e92] [cursor=pointer]:
          - /url: https://github.com/denjamin
        - link "RSS-фид" [ref=e93] [cursor=pointer]:
          - /url: /feed.xml
          - img [ref=e94]
  - button "Open Next.js Dev Tools" [ref=e102] [cursor=pointer]:
    - img [ref=e103]
  - alert [ref=e106]
```

# Test source

```ts
  94  |     // Статус обновился на accepted
  95  |     const updated = await request.get(`/api/reviewer/assignments/${pending.id}`);
  96  |     expect(updated.status()).toBe(200);
  97  |     const updatedBody = await updated.json();
  98  |     expect(updatedBody.status).toBe("accepted");
  99  |   });
  100 | });
  101 | 
  102 | // ── TC-RV-009: Изоляция — 403 на чужое назначение ────────────────────────
  103 | 
  104 | test.describe("TC-RV-009: Изоляция данных", () => {
  105 |   test.use({ storageState: AUTH_FILE });
  106 | 
  107 |   test("GET /api/reviewer/assignments/[чужой_id] → 403", async ({
  108 |     request,
  109 |   }) => {
  110 |     // ID несуществующего/чужого назначения
  111 |     const foreignId = "01AAAAAAAAAAAAAAAAAAAAAAAAA";
  112 |     const resp = await request.get(
  113 |       `/api/reviewer/assignments/${foreignId}`,
  114 |     );
  115 |     expect([403, 404]).toContain(resp.status());
  116 |   });
  117 | });
  118 | 
  119 | // ── TC-RV-011: Комментарий запрещён при completed ─────────────────────────
  120 | 
  121 | test.describe("TC-RV-011: Комментарий при завершённом ревью", () => {
  122 |   test.use({ storageState: AUTH_FILE });
  123 | 
  124 |   test("POST review-comment на completed → 403 или 422", async ({
  125 |     request,
  126 |   }) => {
  127 |     // Находим completed-назначение
  128 |     const resp = await request.get("/api/reviewer/assignments");
  129 |     expect(resp.status()).toBe(200);
  130 |     const body = await resp.json();
  131 |     const assignments: Array<{ id: string; status: string }> = Array.isArray(
  132 |       body,
  133 |     )
  134 |       ? body
  135 |       : body.assignments ?? [];
  136 | 
  137 |     const completed = assignments.find(
  138 |       (a) => a.status === "completed" || a.status === "declined",
  139 |     );
  140 |     if (!completed) {
  141 |       test.skip(
  142 |         true,
  143 |         "Нет completed/declined-назначений в тестовой БД",
  144 |       );
  145 |       return;
  146 |     }
  147 | 
  148 |     const postResp = await request.post(
  149 |       `/api/assignments/${completed.id}/review-comments`,
  150 |       { data: { text: "Комментарий после завершения" } },
  151 |     );
  152 |     expect([403, 422]).toContain(postResp.status());
  153 |   });
  154 | });
  155 | 
  156 | // ── TC-RV-013: Завершить с вердиктом ─────────────────────────────────────
  157 | 
  158 | test.describe("TC-RV-013: Завершить ревью с вердиктом", () => {
  159 |   test.use({ storageState: AUTH_FILE });
  160 | 
  161 |   test("завершить accepted-назначение с вердиктом approved", async ({
  162 |     page,
  163 |     request,
  164 |   }) => {
  165 |     const resp = await request.get("/api/reviewer/assignments");
  166 |     expect(resp.status()).toBe(200);
  167 |     const body = await resp.json();
  168 |     const assignments: Array<{ id: string; status: string }> = Array.isArray(
  169 |       body,
  170 |     )
  171 |       ? body
  172 |       : body.assignments ?? [];
  173 | 
  174 |     const accepted = assignments.find((a) => a.status === "accepted");
  175 |     if (!accepted) {
  176 |       test.skip(true, "Нет accepted-назначений в тестовой БД");
  177 |       return;
  178 |     }
  179 | 
  180 |     await page.goto(`/reviewer/assignments/${accepted.id}`);
  181 | 
  182 |     const completeBtn = page.getByRole("button", {
  183 |       name: /завершить|complete/i,
  184 |     });
  185 |     await expect(completeBtn).toBeVisible({ timeout: 5_000 });
  186 |     await completeBtn.click();
  187 | 
  188 |     // Ожидаем модал с выбором вердикта
  189 |     const approvedOption = page
  190 |       .getByRole("radio", { name: /одобрить|approved/i })
  191 |       .or(page.locator('input[value="approved"]'))
  192 |       .or(page.getByText(/одобрить|approved/i).first());
  193 | 
> 194 |     await expect(approvedOption).toBeVisible({ timeout: 5_000 });
      |                                  ^ Error: expect(locator).toBeVisible() failed
  195 | 
  196 |     // Выбираем вердикт
  197 |     const radioApproved = page.locator('input[value="approved"]');
  198 |     if (await radioApproved.isVisible()) {
  199 |       await radioApproved.click();
  200 |     } else {
  201 |       await approvedOption.click();
  202 |     }
  203 | 
  204 |     // Вводим заметку
  205 |     const noteField = page.locator("textarea").first();
  206 |     if (await noteField.isVisible()) {
  207 |       await noteField.fill("Статья готова к публикации");
  208 |     }
  209 | 
  210 |     // Подтверждаем
  211 |     const confirmBtn = page.getByRole("button", {
  212 |       name: /подтвердить|confirm|сохранить/i,
  213 |     });
  214 |     await confirmBtn.click();
  215 | 
  216 |     // После завершения статус должен смениться
  217 |     await page.waitForTimeout(2_000);
  218 |     const updated = await request.get(
  219 |       `/api/reviewer/assignments/${accepted.id}`,
  220 |     );
  221 |     expect(updated.status()).toBe(200);
  222 |     const updatedBody = await updated.json();
  223 |     expect(updatedBody.status).toBe("completed");
  224 |   });
  225 | });
  226 | 
  227 | // ── TC-RV-014: Завершить без вердикта → 422 ──────────────────────────────
  228 | 
  229 | test.describe("TC-RV-014: Завершить без вердикта", () => {
  230 |   test.use({ storageState: AUTH_FILE });
  231 | 
  232 |   test("PUT assignments/[id] с status=completed без verdict → 422", async ({
  233 |     request,
  234 |   }) => {
  235 |     const resp = await request.get("/api/reviewer/assignments");
  236 |     expect(resp.status()).toBe(200);
  237 |     const body = await resp.json();
  238 |     const assignments: Array<{ id: string; status: string }> = Array.isArray(
  239 |       body,
  240 |     )
  241 |       ? body
  242 |       : body.assignments ?? [];
  243 | 
  244 |     const accepted = assignments.find((a) => a.status === "accepted");
  245 |     if (!accepted) {
  246 |       test.skip(true, "Нет accepted-назначений в тестовой БД");
  247 |       return;
  248 |     }
  249 | 
  250 |     const putResp = await request.put(
  251 |       `/api/reviewer/assignments/${accepted.id}`,
  252 |       { data: { status: "completed" } },
  253 |     );
  254 |     expect([400, 422]).toContain(putResp.status());
  255 |   });
  256 | });
  257 | 
  258 | // ── TC-RV-018: Выход ──────────────────────────────────────────────────────
  259 | 
  260 | test.describe("TC-RV-018: Выход ревьюера", () => {
  261 |   test.use({ storageState: AUTH_FILE });
  262 | 
  263 |   test("нажать «Выйти» — сессия очищена, редирект на /login", async ({
  264 |     page,
  265 |   }) => {
  266 |     await page.goto("/reviewer");
  267 | 
  268 |     const logoutBtn = page
  269 |       .getByRole("button", { name: /выйти|выход|logout|sign out/i })
  270 |       .or(page.getByRole("link", { name: /выйти|выход|logout/i }));
  271 | 
  272 |     await expect(logoutBtn.first()).toBeVisible({ timeout: 5_000 });
  273 |     await logoutBtn.first().click();
  274 | 
  275 |     await page.waitForURL(/\/login/, { timeout: 8_000 });
  276 |     expect(page.url()).toContain("/login");
  277 | 
  278 |     // Попытка зайти напрямую после выхода
  279 |     await page.goto("/reviewer");
  280 |     await page.waitForURL(/\/login/, { timeout: 5_000 });
  281 |     expect(page.url()).toContain("/login");
  282 |   });
  283 | });
  284 | 
  285 | // ── TC-RV-022: Переоткрыть при completed → 403/422 ───────────────────────
  286 | 
  287 | test.describe("TC-RV-022: Переоткрыть resolve при completed", () => {
  288 |   test.use({ storageState: AUTH_FILE });
  289 | 
  290 |   test("PUT /api/review-comments/[id]/resolve при completed → 403 или 422", async ({
  291 |     request,
  292 |   }) => {
  293 |     // Используем несуществующий ID — сервер должен вернуть 403/404/422
  294 |     const fakeCommentId = "01BBBBBBBBBBBBBBBBBBBBBBBBB";
```