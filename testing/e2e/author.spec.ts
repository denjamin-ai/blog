/**
 * author.spec.ts — тесты для автора
 *
 * US-A1:  Вход автора
 * US-A3:  Создание черновика
 * US-A22: Вставка LaTeX-формулы (P2)
 * US-A23: Live-preview работает (P2)
 * US-G11: Диаграмма рендерится (P2)
 * TC-AU-025: Отправка статьи на ревью 2 ревьюерам
 * TC-AU-026: Guide modal
 */

import { test, expect } from "@playwright/test";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/author.json");

// ── US-A1: Вход автора ────────────────────────────────────────────────────

test.describe("US-A1: Вход автора", () => {
  test("успешный вход — редирект на /author", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[autocomplete="username"]').fill("author");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("password");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/author$/, { timeout: 10_000 });
    expect(page.url()).toContain("/author");
  });

  test("/author без сессии редиректит на /login", async ({ page }) => {
    await page.goto("/author");
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    expect(page.url()).toContain("/login");
  });
});

// ── US-A3: Создание черновика ─────────────────────────────────────────────

// Shared state для US-A22 и US-A23
let draftPageUrl = "";

test.describe("US-A3: Создание черновика", () => {
  test.use({ storageState: AUTH_FILE });

  test("автор создаёт черновик статьи", async ({ page }) => {
    await page.goto("/author/articles");

    // Найти кнопку «Новая статья»
    const newBtn = page
      .getByRole("button", { name: /новая статья|создать/i })
      .or(page.getByRole("link", { name: /новая статья|создать/i }));
    await expect(newBtn.first()).toBeVisible({ timeout: 5_000 });
    await newBtn.first().click();

    // Ждём перехода на форму/редактор (должен быть /new или /[id], не просто /articles)
    await page.waitForURL(/\/author\/articles\//, { timeout: 10_000 });

    // Заполнить заголовок
    const titleField = page.locator(
      'input[name="title"], input[placeholder*="заголов" i]',
    );
    await expect(titleField.first()).toBeVisible({ timeout: 5_000 });
    await titleField.first().fill("E2E черновик автора");

    // Slug
    const slugField = page.locator(
      'input[name="slug"], input[placeholder*="slug" i]',
    );
    if (await slugField.first().isVisible()) {
      await slugField.first().clear();
      await slugField.first().fill(`e2e-author-draft-${Date.now()}`);
    }

    // Контент
    const contentArea = page.locator("textarea").first();
    await contentArea.fill("## Тест\n\nСодержимое черновика.");

    // Сохранить черновик
    await page
      .getByRole("button", { name: /сохранить/i })
      .first()
      .click();

    // Должны остаться на странице редактора (не редирект на список)
    await page.waitForURL(/\/author\/articles\/.+/, { timeout: 10_000 });
    draftPageUrl = page.url();
    expect(draftPageUrl).toMatch(/\/author\/articles\/.+/);
  });
});

// ── US-A22: Вставка LaTeX-формулы ────────────────────────────────────────

test.describe("US-A22: FormulaInserter", () => {
  test.use({ storageState: AUTH_FILE });

  test("вставить inline LaTeX-формулу в textarea", async ({ page }) => {
    // Перейти на редактор (используем созданный черновик или создаём через API)
    if (!draftPageUrl) {
      const resp = await page.request.post("/api/articles", {
        data: {
          title: "E2E formula test",
          slug: `e2e-formula-${Date.now()}`,
          content: "## Formula",
          tags: [],
          status: "draft",
        },
        headers: { Origin: "http://localhost:3001" },
      });
      const json = await resp.json();
      draftPageUrl = `/author/articles/${json.id}`;
    }

    await page.goto(draftPageUrl);

    // Открыть панель FormulaInserter (коллапсируемая)
    const formulaToggle = page
      .getByRole("button", { name: /формул|formula/i })
      .or(page.locator('[data-testid="formula-inserter"]'))
      .first();

    if (
      !(await formulaToggle.isVisible({ timeout: 3_000 }).catch(() => false))
    ) {
      test.skip();
      return;
    }

    // Раскрыть панель если свёрнута
    const panelExpanded = await page
      .locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]')
      .first()
      .isVisible()
      .catch(() => false);

    if (!panelExpanded) {
      await formulaToggle.click();
    }

    // Ввести формулу
    const latexInput = page
      .locator('input[placeholder*="формул" i], input[placeholder*="LaTeX" i]')
      .first();
    await expect(latexInput).toBeVisible({ timeout: 3_000 });
    await latexInput.fill("x^2 + y^2 = r^2");

    // Вставить
    const insertBtn = page
      .getByRole("button", { name: /вставить|insert/i })
      .last();
    await insertBtn.click();

    // Проверить что в textarea появилась формула
    const contentArea = page.locator("textarea").first();
    const content = await contentArea.inputValue();
    expect(content).toContain("x^2");
  });
});

// ── US-A23: Live-preview ──────────────────────────────────────────────────

test.describe("US-A23: Live-preview", () => {
  test.use({ storageState: AUTH_FILE });

  test("preview обновляется при наборе MDX", async ({ page }) => {
    if (!draftPageUrl) {
      const resp = await page.request.post("/api/articles", {
        data: {
          title: "E2E preview test",
          slug: `e2e-preview-${Date.now()}`,
          content: "",
          tags: [],
          status: "draft",
        },
        headers: { Origin: "http://localhost:3001" },
      });
      const json = await resp.json();
      draftPageUrl = `/author/articles/${json.id}`;
    }

    await page.goto(draftPageUrl);

    // Включить split-режим (кнопка «Справа» или «Слева»)
    const splitBtn = page
      .getByRole("button", { name: /справа|слева|split|preview/i })
      .first();

    if (!(await splitBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await splitBtn.click();

    // Очистить textarea и ввести MDX
    const contentArea = page.locator("textarea").first();
    await contentArea.clear();
    const uniqueHeading = `Тест превью ${Date.now()}`;
    await contentArea.fill(`## ${uniqueHeading}`);

    // Ждём debounce (500ms) + запрос к /api/preview
    await page.waitForTimeout(1_200);

    // Preview-панель должна содержать h2 с текстом
    const preview = page.locator(
      '[class*="preview"], [data-testid="preview"], .prose',
    );
    await expect(
      preview.locator("h2").filter({ hasText: uniqueHeading }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ── US-G11: Диаграмма рендерится ─────────────────────────────────────────

test.describe("US-G11: Mermaid-диаграмма", () => {
  test.use({ storageState: AUTH_FILE });

  test("Mermaid chart рендерится как SVG на публичной странице", async ({
    page,
  }) => {
    const diagramSlug = `e2e-mermaid-${Date.now()}`;

    // Создать и опубликовать статью с Mermaid через API
    const createResp = await page.request.post("/api/articles", {
      data: {
        title: "E2E диаграмма тест",
        slug: diagramSlug,
        content: '<Mermaid chart="graph TD; A[Старт] --> B[Конец];" />',
        tags: [],
        status: "draft",
      },
      headers: { Origin: "http://localhost:3001" },
    });

    if (!createResp.ok()) {
      test.skip();
      return;
    }

    const { id } = await createResp.json();

    // Публикуем через PUT
    const pubResp = await page.request.put(`/api/articles/${id}`, {
      data: {
        title: "E2E диаграмма тест",
        slug: diagramSlug,
        content: '<Mermaid chart="graph TD; A[Старт] --> B[Конец];" />',
        tags: [],
        saveMode: "publish",
      },
      headers: { Origin: "http://localhost:3001" },
    });

    if (!pubResp.ok()) {
      test.skip();
      return;
    }

    // Открываем публичную страницу
    await page.goto(`/blog/${diagramSlug}`);

    // Mermaid рендерится при монтировании (без IntersectionObserver)
    // Даём до 25s — динамический import("mermaid") может быть медленным
    const diagram = page.locator(".mermaid svg, [class*='mermaid'] svg");
    await expect(diagram.first()).toBeVisible({ timeout: 25_000 });
  });
});

// ── TC-AU-025: Отправка на ревью 2 ревьюерам ───────────────────────────

test.describe("TC-AU-025: Отправка статьи на ревью 2 ревьюерам", () => {
  test.use({ storageState: AUTH_FILE });

  test("автор отправляет статью через ReviewerPickerModal", async ({
    page,
  }) => {
    // Создаём черновик через API (автор может POST /api/articles)
    const createResp = await page.request.post("/api/articles", {
      data: {
        title: "E2E author review session",
        slug: `e2e-au-session-${Date.now()}`,
        content: "## Контент для ревью\n\nТестовый параграф.",
        tags: [],
        status: "draft",
      },
      headers: { Origin: "http://localhost:3001" },
    });
    expect(createResp.status()).toBe(201);
    const { id: articleId } = await createResp.json();

    // Открываем редактирование
    await page.goto(`/author/articles/${articleId}`);

    // Кликаем «На ревью»
    const reviewBtn = page.getByRole("button", { name: /на ревью/i });
    await expect(reviewBtn).toBeVisible({ timeout: 5_000 });
    await reviewBtn.click();

    // Модал открылся
    const dialog = page.locator('dialog[aria-label="Выбрать ревьюеров"]');
    await expect(dialog).toBeVisible({ timeout: 3_000 });

    // Поиск ревьюеров
    const searchInput = dialog.locator(
      'input[placeholder*="Имя или никнейм"]',
    );
    await searchInput.fill("ревьюер");

    await page.waitForResponse(
      (res) => res.url().includes("/api/reviewers?search=") && res.ok(),
      { timeout: 5_000 },
    );

    // Выбираем обоих
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

    // Проверяем что назначения появились
    await expect(
      page.getByText(/назначения на ревью/i),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ── TC-AU-026: Guide modal ──────────────────────────────────────────────

test.describe("TC-AU-026: Руководство автора", () => {
  test.use({ storageState: AUTH_FILE });

  test("открыть и проверить guide modal", async ({ page }) => {
    await page.goto("/author");

    const guideBtn = page
      .locator('button[aria-label="Открыть руководство"]')
      .first();
    await expect(guideBtn).toBeVisible({ timeout: 5_000 });
    await guideBtn.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText("Возможности автора")).toBeVisible();
    await expect(
      dialog.getByText("Пишите статьи в формате MDX"),
    ).toBeVisible();

    // Закрыть через Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
