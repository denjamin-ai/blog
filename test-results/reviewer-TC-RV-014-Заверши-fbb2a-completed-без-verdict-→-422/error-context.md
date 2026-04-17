# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reviewer.spec.ts >> TC-RV-014: Завершить без вердикта >> PUT assignments/[id] с status=completed без verdict → 422
- Location: testing/e2e/reviewer.spec.ts:232:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 405
Received array: [400, 422]
```

# Test source

```ts
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
  194 |     await expect(approvedOption).toBeVisible({ timeout: 5_000 });
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
> 254 |     expect([400, 422]).toContain(putResp.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
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
  295 |     const putResp = await request.put(
  296 |       `/api/review-comments/${fakeCommentId}/resolve`,
  297 |       { data: { resolved: false } },
  298 |     );
  299 |     expect([403, 404, 422]).toContain(putResp.status());
  300 |   });
  301 | });
  302 | 
  303 | // ── TC-RV-023: Только свои назначения ────────────────────────────────────
  304 | 
  305 | test.describe("TC-RV-023: Изоляция — только свои назначения", () => {
  306 |   test.use({ storageState: AUTH_FILE });
  307 | 
  308 |   test("GET /api/reviewer/assignments — все в ответе принадлежат текущему ревьюеру", async ({
  309 |     request,
  310 |   }) => {
  311 |     const resp = await request.get("/api/reviewer/assignments");
  312 |     expect(resp.status()).toBe(200);
  313 |     const body = await resp.json();
  314 |     const assignments: Array<{ reviewerId?: string; id: string }> =
  315 |       Array.isArray(body) ? body : body.assignments ?? [];
  316 | 
  317 |     // Получаем текущего пользователя
  318 |     const userResp = await request.get("/api/auth/user");
  319 |     expect(userResp.status()).toBe(200);
  320 |     const user = await userResp.json();
  321 |     const currentUserId = user.userId;
  322 | 
  323 |     // Все назначения должны принадлежать текущему ревьюеру
  324 |     for (const assignment of assignments) {
  325 |       if (assignment.reviewerId) {
  326 |         expect(assignment.reviewerId).toBe(currentUserId);
  327 |       }
  328 |     }
  329 |   });
  330 | });
  331 | 
  332 | // ── TC-RV-024: Ревьюер не может зайти в /admin ───────────────────────────
  333 | 
  334 | test.describe("TC-RV-024: Нет доступа к /admin", () => {
  335 |   test.use({ storageState: AUTH_FILE });
  336 | 
  337 |   test("переход на /admin → редирект или 403", async ({ page }) => {
  338 |     const response = await page.goto("/admin");
  339 |     const finalUrl = page.url();
  340 | 
  341 |     // Должен быть редирект на /admin/login или на другую страницу авторизации
  342 |     const isRedirected =
  343 |       finalUrl.includes("/admin/login") ||
  344 |       finalUrl.includes("/login") ||
  345 |       !finalUrl.includes("/admin");
  346 | 
  347 |     const statusForbidden = response?.status() === 403;
  348 | 
  349 |     expect(isRedirected || statusForbidden).toBeTruthy();
  350 |   });
  351 | });
  352 | 
  353 | // ── TC-RV-025/026: Review Session — общий чат и участники ────────────────
  354 | 
```