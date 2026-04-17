/**
 * admin.spec.ts — тесты для администратора
 *
 * US-AD1: Вход администратора
 * US-AD4: Создание статьи (MDX)
 * US-AD5: Редактирование + сохранение
 * US-AD6: Публикация / снятие с публикации
 * TC-AD-030: Создание review session с 2 ревьюерами
 * TC-AD-031: Руководство (guide modal)
 */

import { test, expect } from "@playwright/test";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/admin.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD_PLAIN ?? "dhome$32";

// Shared state между тестами AD4 → AD5 → AD6
let createdArticleUrl = "";
const TEST_SLUG = `e2e-admin-test-${Date.now()}`;

// ── US-AD1: Вход ──────────────────────────────────────────────────────────

test.describe("US-AD1: Вход администратора", () => {
  test("успешный вход с верным паролем", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByRole("heading", { name: /вход в админку/i }),
    ).toBeVisible();

    await page
      .locator('input[autocomplete="current-password"]')
      .fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin$/, { timeout: 10_000 });

    // Убедились что попали в дашборд
    expect(page.url()).toContain("/admin");
  });

  test("неверный пароль — ошибка, редиректа нет", async ({ page }) => {
    await page.goto("/admin/login");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("wrong-password");
    await page.locator('button[type="submit"]').click();

    // Остаёмся на /admin/login
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain("/admin/login");
    // Должно быть сообщение об ошибке
    await expect(
      page.locator("p.text-red-500, [class*='error']"),
    ).toBeVisible();
  });

  test("защищённые роуты без сессии редиректят на /admin/login", async ({
    page,
  }) => {
    // Чистый контекст — нет cookies
    const response = await page.goto("/admin");
    // Должен быть редирект (307 или 302) → /admin/login
    expect(page.url()).toContain("/admin/login");
    // Финальный статус страницы логина — 200
    expect(response?.status()).toBe(200);
  });
});

// ── US-AD4: Создание статьи ───────────────────────────────────────────────

test.describe("US-AD4: Создание статьи", () => {
  test.use({ storageState: AUTH_FILE });

  test("создать MDX-черновик через форму", async ({ page }) => {
    await page.goto("/admin/articles/new");

    // Заполняем заголовок
    await page
      .locator('input[name="title"], input[placeholder*="заголов" i]')
      .fill("E2E тест — создание статьи");

    // Slug (может авто-заполниться, если нет — заполняем вручную)
    const slugField = page.locator(
      'input[name="slug"], input[placeholder*="slug" i]',
    );
    const slugValue = await slugField.inputValue();
    if (!slugValue) {
      await slugField.fill(TEST_SLUG);
    } else {
      // Сохраним авто-slug
      await slugField.clear();
      await slugField.fill(TEST_SLUG);
    }

    // Контент MDX
    const contentArea = page.locator("textarea").first();
    await contentArea.fill("## Заголовок\n\nТестовый параграф.");

    // Сохранить как черновик
    await page
      .getByRole("button", { name: /сохранить/i })
      .first()
      .click();

    // Ожидаем редирект на страницу редактирования (ID, не /new)
    await page.waitForURL(/\/admin\/articles\/(?!new)[^/]+/, {
      timeout: 10_000,
    });
    createdArticleUrl = page.url();
    expect(createdArticleUrl).toMatch(/\/admin\/articles\/(?!new)[^/]+/);
  });
});

// ── US-AD5: Редактирование ────────────────────────────────────────────────

test.describe("US-AD5: Редактирование статьи", () => {
  test.use({ storageState: AUTH_FILE });

  test("изменить заголовок и сохранить", async ({ page }) => {
    // Если createdArticleUrl пустой — создаём временную статью через API
    if (!createdArticleUrl) {
      const resp = await page.request.post("/api/articles", {
        data: {
          title: "E2E temp article",
          slug: `e2e-temp-${Date.now()}`,
          content: "## Test",
          tags: [],
          status: "draft",
        },
        headers: { Origin: "http://localhost:3001" },
      });
      const json = await resp.json();
      createdArticleUrl = `/admin/articles/${json.id}`;
    }

    await page.goto(createdArticleUrl);

    const titleField = page.locator(
      'input[name="title"], input[placeholder*="заголов" i]',
    );
    await titleField.clear();
    await titleField.fill("E2E тест — отредактированный заголовок");

    // Ожидаем PUT-ответ и клик одновременно
    const [putResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/articles/") &&
          res.request().method() === "PUT",
        { timeout: 8_000 },
      ),
      page
        .getByRole("button", { name: /сохранить/i })
        .first()
        .click(),
    ]);

    // Убеждаемся что сохранение прошло успешно
    expect(putResponse.status()).toBe(200);
  });
});

// ── US-AD6: Публикация / снятие ───────────────────────────────────────────

test.describe("US-AD6: Публикация и снятие статьи", () => {
  test.use({ storageState: AUTH_FILE });

  test("опубликовать черновик", async ({ page }) => {
    if (!createdArticleUrl) {
      const resp = await page.request.post("/api/articles", {
        data: {
          title: "E2E publish test",
          slug: `e2e-pub-${Date.now()}`,
          content: "## Pub test",
          tags: [],
          status: "draft",
        },
        headers: { Origin: "http://localhost:3001" },
      });
      const json = await resp.json();
      createdArticleUrl = `/admin/articles/${json.id}`;
    }

    await page.goto(createdArticleUrl);

    // Нажать «Опубликовать»
    await page.getByRole("button", { name: /опубликовать/i }).click();

    // Ждём смену состояния: появится кнопка «Снять с публикации» или статус «published»
    await expect(
      page
        .getByRole("button", { name: /снять/i })
        .or(page.getByText(/опубликовано|published/i))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("снять с публикации", async ({ page }) => {
    // Публикуем через API, затем снимаем через UI
    const resp = await page.request.post("/api/articles", {
      data: {
        title: "E2E unpublish test",
        slug: `e2e-unpub-${Date.now()}`,
        content: "## Unpub test",
        tags: [],
        status: "published",
      },
      headers: { Origin: "http://localhost:3001" },
    });
    const json = await resp.json();
    await page.goto(`/admin/articles/${json.id}`);

    // Должна быть кнопка «Снять с публикации»
    const unpublishBtn = page.getByRole("button", { name: /снять/i });
    await expect(unpublishBtn).toBeVisible({ timeout: 5_000 });
    await unpublishBtn.click();

    // Ждём смену на «Опубликовать»
    await expect(
      page.getByRole("button", { name: /опубликовать/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ── TC-AD-030: Создание review session с 2 ревьюерами ───────────────────

test.describe("TC-AD-030: Создание review session с 2 ревьюерами", () => {
  test.use({ storageState: AUTH_FILE });

  test("отправить статью на ревью 2 ревьюерам через ReviewerPickerModal", async ({
    page,
  }) => {
    // Создаём черновик через API
    const createResp = await page.request.post("/api/articles", {
      data: {
        title: "E2E session test",
        slug: `e2e-session-${Date.now()}`,
        content: "## Тестовая статья для ревью-сессии\n\nКонтент для проверки.",
        tags: [],
        status: "draft",
      },
      headers: { Origin: "http://localhost:3001" },
    });
    expect(createResp.status()).toBe(201);
    const { id: articleId } = await createResp.json();

    // Открываем страницу редактирования
    await page.goto(`/admin/articles/${articleId}`);

    // Кликаем «На ревью»
    const reviewBtn = page.getByRole("button", { name: /на ревью/i });
    await expect(reviewBtn).toBeVisible({ timeout: 5_000 });
    await reviewBtn.click();

    // Ожидаем открытие модала
    const dialog = page.locator('dialog[aria-label="Выбрать ревьюеров"]');
    await expect(dialog).toBeVisible({ timeout: 3_000 });

    // Вводим поиск «ревьюер» — совпадёт с «Тестовый ревьюер» и «Второй ревьюер»
    const searchInput = dialog.locator(
      'input[placeholder*="Имя или никнейм"]',
    );
    await searchInput.fill("ревьюер");

    // Ждём результаты поиска
    await page.waitForResponse(
      (res) => res.url().includes("/api/reviewers?search=") && res.ok(),
      { timeout: 5_000 },
    );

    // Кликаем по обоим ревьюерам
    const firstReviewer = dialog.locator("button", {
      hasText: "Тестовый ревьюер",
    });
    const secondReviewer = dialog.locator("button", {
      hasText: "Второй ревьюер",
    });

    await expect(firstReviewer).toBeVisible({ timeout: 3_000 });
    await firstReviewer.click();

    await expect(secondReviewer).toBeVisible({ timeout: 3_000 });
    await secondReviewer.click();

    // Проверяем счётчик
    await expect(dialog.getByText(/Выбрано: 2 из \d+/)).toBeVisible();

    // Подтверждаем
    const [putResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/articles/") &&
          res.request().method() === "PUT",
        { timeout: 10_000 },
      ),
      dialog.getByRole("button", { name: /подтвердить/i }).click(),
    ]);
    expect(putResponse.status()).toBe(200);

    // Проверяем, что секция назначений появилась
    await expect(
      page.getByText(/назначения на ревью/i),
    ).toBeVisible({ timeout: 5_000 });

    // Проверяем через API, что сессия создана с 2 назначениями
    const sessionsResp = await page.request.get(
      `/api/articles/${articleId}/review-sessions`,
      { headers: { Origin: "http://localhost:3001" } },
    );
    expect(sessionsResp.status()).toBe(200);
    const sessions = await sessionsResp.json();
    const sessionArr = Array.isArray(sessions) ? sessions : sessions.sessions ?? [];
    expect(sessionArr.length).toBeGreaterThanOrEqual(1);

    const latestSession = sessionArr[sessionArr.length - 1];
    const assignmentCount =
      latestSession.assignments?.length ?? latestSession.assignmentIds?.length ?? 0;
    expect(assignmentCount).toBe(2);
  });
});

// ── TC-AD-031: Guide modal ──────────────────────────────────────────────

test.describe("TC-AD-031: Руководство админа", () => {
  test.use({ storageState: AUTH_FILE });

  test("открыть и закрыть guide modal", async ({ page }) => {
    await page.goto("/admin");

    // Клик по кнопке руководства
    const guideBtn = page.locator('button[aria-label="Открыть руководство"]').first();
    await expect(guideBtn).toBeVisible({ timeout: 5_000 });
    await guideBtn.click();

    // Проверяем контент
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText("Возможности администратора")).toBeVisible();
    await expect(
      dialog.getByText("Создавайте и редактируйте статьи всех авторов"),
    ).toBeVisible();

    // Закрываем
    await dialog.locator('button[aria-label="Закрыть"]').click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
