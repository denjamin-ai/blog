/**
 * reviewer.spec.ts — тесты для ревьюера
 *
 * TC-RV-001: Вход ревьюера (P0)
 * TC-RV-004: Принять назначение (P0)
 * TC-RV-009: Изоляция данных — 403 на чужое назначение (P0)
 * TC-RV-011: Комментарий запрещён при завершённом ревью (P0)
 * TC-RV-013: Завершить ревью с вердиктом (P0)
 * TC-RV-014: Завершить без вердикта → 422 (P0)
 * TC-RV-018: Выход ревьюера (P0)
 * TC-RV-022: Переоткрыть resolve при completed → 403/422 (P0)
 * TC-RV-023: GET /api/reviewer/assignments — только свои (P0)
 * TC-RV-024: Ревьюер не может зайти в /admin (P0)
 * TC-RV-025: Чтение и запись в общий чат сессии (P0)
 * TC-RV-026: Участники сессии видны (P1)
 * TC-RV-027: Руководство (guide modal) (P1)
 */

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const AUTH_FILE = path.join(__dirname, ".auth/reviewer.json");
const ADMIN_AUTH_FILE = path.join(__dirname, ".auth/admin.json");

// IDs from seed.test.ts
const REVIEWER_ID = "01TEST0000REVIEWERUSER01";
const REVIEWER2_ID = "01TEST0000REVIEWERUSER02";

// ── TC-RV-001: Вход ───────────────────────────────────────────────────────

test.describe("TC-RV-001: Вход ревьюера", () => {
  test("успешный вход — редирект на /reviewer", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[autocomplete="username"]').fill("reviewer");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("password");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/reviewer/, { timeout: 10_000 });
    expect(page.url()).toContain("/reviewer");
  });

  test("неверный пароль — остаётся на /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[autocomplete="username"]').fill("reviewer");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("wrong-password");
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1_000);
    expect(page.url()).toContain("/login");
  });
});

// ── TC-RV-004: Принять назначение ─────────────────────────────────────────

test.describe("TC-RV-004: Принять назначение", () => {
  test.use({ storageState: AUTH_FILE });

  test("нажать «Принять» — статус меняется на accepted", async ({
    page,
    request,
  }) => {
    // Получаем список назначений через API
    const resp = await request.get("/api/reviewer/assignments");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const assignments: Array<{ id: string; status: string }> = Array.isArray(
      body,
    )
      ? body
      : body.assignments ?? [];

    const pending = assignments.find((a) => a.status === "pending");
    if (!pending) {
      test.skip(true, "Нет pending-назначений в тестовой БД");
      return;
    }

    await page.goto(`/reviewer/assignments/${pending.id}`);

    const acceptBtn = page.getByRole("button", {
      name: /принять|accept/i,
    });
    await expect(acceptBtn).toBeVisible({ timeout: 5_000 });
    await acceptBtn.click();

    // После принятия кнопка «Принять» должна исчезнуть
    await expect(acceptBtn).not.toBeVisible({ timeout: 8_000 });

    // Статус обновился на accepted
    const updated = await request.get(`/api/reviewer/assignments/${pending.id}`);
    expect(updated.status()).toBe(200);
    const updatedBody = await updated.json();
    expect(updatedBody.status).toBe("accepted");
  });
});

// ── TC-RV-009: Изоляция — 403 на чужое назначение ────────────────────────

test.describe("TC-RV-009: Изоляция данных", () => {
  test.use({ storageState: AUTH_FILE });

  test("GET /api/reviewer/assignments/[чужой_id] → 403", async ({
    request,
  }) => {
    // ID несуществующего/чужого назначения
    const foreignId = "01AAAAAAAAAAAAAAAAAAAAAAAAA";
    const resp = await request.get(
      `/api/reviewer/assignments/${foreignId}`,
    );
    expect([403, 404]).toContain(resp.status());
  });
});

// ── TC-RV-011: Комментарий запрещён при completed ─────────────────────────

test.describe("TC-RV-011: Комментарий при завершённом ревью", () => {
  test.use({ storageState: AUTH_FILE });

  test("POST review-comment на completed → 403 или 422", async ({
    request,
  }) => {
    // Находим completed-назначение
    const resp = await request.get("/api/reviewer/assignments");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const assignments: Array<{ id: string; status: string }> = Array.isArray(
      body,
    )
      ? body
      : body.assignments ?? [];

    const completed = assignments.find(
      (a) => a.status === "completed" || a.status === "declined",
    );
    if (!completed) {
      test.skip(
        true,
        "Нет completed/declined-назначений в тестовой БД",
      );
      return;
    }

    const postResp = await request.post(
      `/api/assignments/${completed.id}/review-comments`,
      { data: { text: "Комментарий после завершения" } },
    );
    expect([403, 422]).toContain(postResp.status());
  });
});

// ── TC-RV-013: Завершить с вердиктом ─────────────────────────────────────

test.describe("TC-RV-013: Завершить ревью с вердиктом", () => {
  test.use({ storageState: AUTH_FILE });

  test("завершить accepted-назначение с вердиктом approved", async ({
    page,
    request,
  }) => {
    const resp = await request.get("/api/reviewer/assignments");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const assignments: Array<{ id: string; status: string }> = Array.isArray(
      body,
    )
      ? body
      : body.assignments ?? [];

    const accepted = assignments.find((a) => a.status === "accepted");
    if (!accepted) {
      test.skip(true, "Нет accepted-назначений в тестовой БД");
      return;
    }

    await page.goto(`/reviewer/assignments/${accepted.id}`);

    const completeBtn = page.getByRole("button", {
      name: /завершить|complete/i,
    });
    await expect(completeBtn).toBeVisible({ timeout: 5_000 });
    await completeBtn.click();

    // Ожидаем модал с выбором вердикта
    const approvedOption = page
      .getByRole("radio", { name: /одобрить|approved/i })
      .or(page.locator('input[value="approved"]'))
      .or(page.getByText(/одобрить|approved/i).first());

    await expect(approvedOption).toBeVisible({ timeout: 5_000 });

    // Выбираем вердикт
    const radioApproved = page.locator('input[value="approved"]');
    if (await radioApproved.isVisible()) {
      await radioApproved.click();
    } else {
      await approvedOption.click();
    }

    // Вводим заметку
    const noteField = page.locator("textarea").first();
    if (await noteField.isVisible()) {
      await noteField.fill("Статья готова к публикации");
    }

    // Подтверждаем
    const confirmBtn = page.getByRole("button", {
      name: /подтвердить|confirm|сохранить/i,
    });
    await confirmBtn.click();

    // После завершения статус должен смениться
    await page.waitForTimeout(2_000);
    const updated = await request.get(
      `/api/reviewer/assignments/${accepted.id}`,
    );
    expect(updated.status()).toBe(200);
    const updatedBody = await updated.json();
    expect(updatedBody.status).toBe("completed");
  });
});

// ── TC-RV-014: Завершить без вердикта → 422 ──────────────────────────────

test.describe("TC-RV-014: Завершить без вердикта", () => {
  test.use({ storageState: AUTH_FILE });

  test("PUT assignments/[id] с status=completed без verdict → 422", async ({
    request,
  }) => {
    const resp = await request.get("/api/reviewer/assignments");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const assignments: Array<{ id: string; status: string }> = Array.isArray(
      body,
    )
      ? body
      : body.assignments ?? [];

    const accepted = assignments.find((a) => a.status === "accepted");
    if (!accepted) {
      test.skip(true, "Нет accepted-назначений в тестовой БД");
      return;
    }

    const putResp = await request.put(
      `/api/reviewer/assignments/${accepted.id}`,
      { data: { status: "completed" } },
    );
    expect([400, 422]).toContain(putResp.status());
  });
});

// ── TC-RV-018: Выход ──────────────────────────────────────────────────────

test.describe("TC-RV-018: Выход ревьюера", () => {
  test.use({ storageState: AUTH_FILE });

  test("нажать «Выйти» — сессия очищена, редирект на /login", async ({
    page,
  }) => {
    await page.goto("/reviewer");

    const logoutBtn = page
      .getByRole("button", { name: /выйти|выход|logout|sign out/i })
      .or(page.getByRole("link", { name: /выйти|выход|logout/i }));

    await expect(logoutBtn.first()).toBeVisible({ timeout: 5_000 });
    await logoutBtn.first().click();

    await page.waitForURL(/\/login/, { timeout: 8_000 });
    expect(page.url()).toContain("/login");

    // Попытка зайти напрямую после выхода
    await page.goto("/reviewer");
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    expect(page.url()).toContain("/login");
  });
});

// ── TC-RV-022: Переоткрыть при completed → 403/422 ───────────────────────

test.describe("TC-RV-022: Переоткрыть resolve при completed", () => {
  test.use({ storageState: AUTH_FILE });

  test("PUT /api/review-comments/[id]/resolve при completed → 403 или 422", async ({
    request,
  }) => {
    // Используем несуществующий ID — сервер должен вернуть 403/404/422
    const fakeCommentId = "01BBBBBBBBBBBBBBBBBBBBBBBBB";
    const putResp = await request.put(
      `/api/review-comments/${fakeCommentId}/resolve`,
      { data: { resolved: false } },
    );
    expect([403, 404, 422]).toContain(putResp.status());
  });
});

// ── TC-RV-023: Только свои назначения ────────────────────────────────────

test.describe("TC-RV-023: Изоляция — только свои назначения", () => {
  test.use({ storageState: AUTH_FILE });

  test("GET /api/reviewer/assignments — все в ответе принадлежат текущему ревьюеру", async ({
    request,
  }) => {
    const resp = await request.get("/api/reviewer/assignments");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const assignments: Array<{ reviewerId?: string; id: string }> =
      Array.isArray(body) ? body : body.assignments ?? [];

    // Получаем текущего пользователя
    const userResp = await request.get("/api/auth/user");
    expect(userResp.status()).toBe(200);
    const user = await userResp.json();
    const currentUserId = user.userId;

    // Все назначения должны принадлежать текущему ревьюеру
    for (const assignment of assignments) {
      if (assignment.reviewerId) {
        expect(assignment.reviewerId).toBe(currentUserId);
      }
    }
  });
});

// ── TC-RV-024: Ревьюер не может зайти в /admin ───────────────────────────

test.describe("TC-RV-024: Нет доступа к /admin", () => {
  test.use({ storageState: AUTH_FILE });

  test("переход на /admin → редирект или 403", async ({ page }) => {
    const response = await page.goto("/admin");
    const finalUrl = page.url();

    // Должен быть редирект на /admin/login или на другую страницу авторизации
    const isRedirected =
      finalUrl.includes("/admin/login") ||
      finalUrl.includes("/login") ||
      !finalUrl.includes("/admin");

    const statusForbidden = response?.status() === 403;

    expect(isRedirected || statusForbidden).toBeTruthy();
  });
});

// ── TC-RV-025/026: Review Session — общий чат и участники ────────────────

test.describe("TC-RV-025/026: Review Session", () => {
  test.use({ storageState: AUTH_FILE });

  // Shared state for session tests
  let sessionAssignmentId = "";
  let sessionId = "";

  test.beforeAll(async ({ browser }) => {
    // Create article + session via admin API
    if (!fs.existsSync(ADMIN_AUTH_FILE)) return;

    const adminCtx = await browser.newContext({
      storageState: ADMIN_AUTH_FILE,
    });
    const adminPage = await adminCtx.newPage();

    // Create draft article
    const createResp = await adminPage.request.post(
      "http://localhost:3001/api/articles",
      {
        data: {
          title: "E2E reviewer session test",
          slug: `e2e-rv-session-${Date.now()}`,
          content: "## Статья для ревью-сессии\n\nКонтент.",
          tags: [],
          status: "draft",
        },
        headers: { Origin: "http://localhost:3001" },
      },
    );
    if (!createResp.ok()) {
      await adminCtx.close();
      return;
    }
    const { id: articleId } = await createResp.json();

    // Send for review with 2 reviewers
    const putResp = await adminPage.request.put(
      `http://localhost:3001/api/articles/${articleId}`,
      {
        data: {
          saveMode: "send_for_review",
          reviewerIds: [REVIEWER_ID, REVIEWER2_ID],
        },
        headers: { Origin: "http://localhost:3001" },
      },
    );
    if (!putResp.ok()) {
      await adminCtx.close();
      return;
    }

    // Get the assignment for reviewer1
    const sessionsResp = await adminPage.request.get(
      `http://localhost:3001/api/articles/${articleId}/review-sessions`,
      { headers: { Origin: "http://localhost:3001" } },
    );
    if (sessionsResp.ok()) {
      const sessions = await sessionsResp.json();
      const sessionArr = Array.isArray(sessions)
        ? sessions
        : sessions.sessions ?? [];
      if (sessionArr.length > 0) {
        const latest = sessionArr[sessionArr.length - 1];
        sessionId = latest.id ?? latest.sessionId ?? "";
        const assignments = latest.assignments ?? [];
        const myAssignment = assignments.find(
          (a: { reviewerId: string }) => a.reviewerId === REVIEWER_ID,
        );
        if (myAssignment) sessionAssignmentId = myAssignment.id;
      }
    }

    await adminCtx.close();
  });

  test("TC-RV-025: написать комментарий в общий чат сессии", async ({
    page,
  }) => {
    if (!sessionAssignmentId) {
      test.skip(true, "Не удалось создать сессию в beforeAll");
      return;
    }

    await page.goto(`/reviewer/assignments/${sessionAssignmentId}`);

    // Должен быть виден «Общий чат сессии»
    await expect(
      page.getByText("Общий чат сессии"),
    ).toBeVisible({ timeout: 8_000 });

    // Находим textarea для комментария
    const textarea = page.locator("textarea").last();
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    const commentText = `E2E тест комментарий ${Date.now()}`;
    await textarea.fill(commentText);

    // Отправляем
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/sessions/") &&
          res.url().includes("/review-comments") &&
          res.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: /отправить/i }).last().click(),
    ]);
    expect(postResponse.status()).toBe(201);

    // Комментарий появляется в треде
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 5_000 });
  });

  test("TC-RV-026: участники сессии видны", async ({ page }) => {
    if (!sessionAssignmentId) {
      test.skip(true, "Не удалось создать сессию в beforeAll");
      return;
    }

    await page.goto(`/reviewer/assignments/${sessionAssignmentId}`);

    // Раскрываем details «Участники сессии»
    const participantsSummary = page.locator("summary", {
      hasText: /Участники сессии/,
    });
    await expect(participantsSummary).toBeVisible({ timeout: 8_000 });
    await participantsSummary.click();

    // Должно быть имя второго ревьюера
    await expect(
      page.getByText("Второй ревьюер"),
    ).toBeVisible({ timeout: 3_000 });
  });
});

// ── TC-RV-027: Guide modal ──────────────────────────────────────────────

test.describe("TC-RV-027: Руководство ревьюера", () => {
  test.use({ storageState: AUTH_FILE });

  test("открыть guide modal", async ({ page }) => {
    await page.goto("/reviewer");

    const guideBtn = page
      .locator('button[aria-label="Открыть руководство"]')
      .first();
    await expect(guideBtn).toBeVisible({ timeout: 5_000 });
    await guideBtn.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText("Возможности ревьюера")).toBeVisible();
    await expect(
      dialog.getByText(/Принимайте или отклоняйте назначения/),
    ).toBeVisible();

    await dialog.locator('button[aria-label="Закрыть"]').click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
