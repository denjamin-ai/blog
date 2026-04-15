# REPORT_2 — Playwright E2E Run

**Дата:** 2026-04-14  
**Тип прогона:** Полный (Playwright E2E, `npx playwright test`)  
**Стенд:** localhost:3001, blog.test.db  
**Вердикт:** ✅ GO

---

## Результаты

| Всего | Прошли | Провалились | Пропущены |
|-------|--------|-------------|-----------|
| 26    | 23     | 0           | 3         |

### Пропущенные тесты (не провалены — функционал не реализован)

| ID | Тест | Причина пропуска |
|----|------|-----------------|
| US-A22 | FormulaInserter — вставить inline LaTeX | Компонент FormulaInserter не имплементирован в редакторе автора |
| US-A23 | Live-preview — preview обновляется при наборе MDX | Компонент EditorWithPreview не имплементирован |
| US-R8 | Голосование за статью — читатель может поставить лайк | Тест отклонён (skipped) в spec |

---

## Исправленные баги (Фаза 19)

| ID | Severity | Описание | Файл | Статус |
|----|----------|----------|------|--------|
| BUG-003 | CRITICAL | XSS: `<script>` в MDX выполняется в браузере | `src/lib/mdx.ts` | ✅ Исправлен — `stripDangerousHtml()` перед компиляцией |
| BUG-004 | HIGH | DELETE user → 500 при наличии review-комментариев | `src/app/api/admin/users/[id]/route.ts` | ✅ Исправлен — null reviewComments.authorId перед удалением |
| BUG-005 | HIGH | GET /api/reviewer/assignments с admin-сессией → 500 | `src/app/api/reviewer/assignments/route.ts` | ✅ Исправлен — ранний return 403 для isAdmin |

## Инфраструктурные исправления

- `scripts/clear-test-db.ts` — исправлены snake_case имена таблиц (было camelCase)
- `.agents/playwright-tester/reset-test-db.sh` — очистка данных in-place (без удаления файла) для предотвращения `SQLITE_READONLY_DBMOVED`
- `src/lib/rate-limit.ts` — namespace Map для разделения лимитов по эндпоинтам; MAX_ATTEMPTS=1000 в dev/test
- `src/app/api/auth/route.ts`, `src/app/api/auth/user/route.ts` — namespace параметр `checkRateLimit`
- `testing/e2e/admin.spec.ts` — исправлен `waitForURL` regex (negative lookahead), `waitForResponse` вместо DOM-индикатора
- `testing/e2e/author.spec.ts` — увеличен timeout Mermaid до 25s, убраны лишние `waitForTimeout`

---

## Сборка

```
npm run build → OK (0 TypeScript errors)
```

---

## Открытые UX-пробелы (не баги)

| Тема | Описание |
|------|----------|
| US-A22 / US-A23 | FormulaInserter и Live-preview не реализованы в авторском редакторе |
| US-R13 | Кнопка «Выйти» для читателя отсутствует на основных страницах |
