# Test Plan: Blog Platform — Полное покрытие

**Версия:** 1.0  
**Дата:** 2026-04-13  
**Проект:** Personal Blog Platform  
**Стек:** Next.js 16, Drizzle ORM + libsql/Turso, iron-session, next-mdx-remote

---

## 1. Executive Summary

Тест-план охватывает все 87 пользовательских историй (JTBD.md) для пяти групп пользователей: Гость, Читатель, Автор, Ревьюер, Администратор. Цель — подтвердить корректность бизнес-логики, защиту данных и стабильность пользовательского пути перед каждым релизом.

---

## 2. Scope

### In Scope
- Аутентификация и авторизация (все роли)
- Публичный блог: главная, список статей, страница статьи, профиль автора
- Система комментариев: создание, редактирование, удаление, вложенность, вотинг
- Engagement: закладки, голосование, подписки, просмотры
- Управление статьями: CRUD, версионирование, планирование, превью
- Процесс ревью: назначение, чеклист, вердикт, комментарии ревью, diff; мультиревьюер (1–3 ревьюера на статью), общий чат сессии
- Модальное окно «Руководство» (для всех ролей)
- Уведомления (все роли)
- Admin: пользователи, настройки блога, шаблон чеклиста
- Upload изображений
- RSS-лента
- Security: CSRF, rate-limit, ownership checks, `isBlocked`, `commentingBlocked`

### UI/UX тестирование (Фазы 20–24)
- Responsive layout: 375px, 768px, 1024px
- Accessibility: skip-to-content, aria-labels, focus-visible, reduced motion
- Визуальная консистентность: CSS-переменные, темы, hover/empty states

### Out of Scope
- Load / stress testing (нагрузочное)
- CI/CD pipeline
- Деплой на Vercel / Turso

### Дополнительно (Фаза 17)
- E2E автотесты (Playwright `@playwright/test`): критические пути P0–P1
  - Команда: `npm run test:e2e` (требует запущенного `npm run dev:test`)
  - Тесты: `testing/e2e/*.spec.ts`
  - Отчёты: `testing/reports/playwright-html/`, индекс в `testing/reports/REPORT_LOG.md`

---

## 3. Test Strategy

| Тип | Метод | Инструмент |
|-----|-------|------------|
| Functional | Black box, позитивные + негативные сценарии | Браузер + DevTools |
| Integration | API запросы, проверка БД | curl / браузер |
| Security | Boundary values, авторизационные проверки | Браузер, DevTools |
| Regression | Дымовые тесты перед каждым деплоем | SMOKE-SUITE.md |
| UI | Тема (light/dark), адаптивность | Браузер |

---

## 4. Test Environment

| Параметр | Значение |
|----------|---------|
| URL | `http://localhost:3000` |
| БД | `file:blog.db` (dev) |
| Команда запуска | `npm run dev` |
| Сид данных | `npm run seed` |
| Браузеры | Chrome (latest), Firefox (latest) |
| ОС | Linux / macOS / Windows |

### Тестовые аккаунты (после сида)

| Роль | Никнейм | Пароль |
|------|---------|--------|
| Читатель | `reader` | `password` |
| Автор | `author` | `password` |
| Ревьюер | `reviewer` | `password` |
| Админ (env) | — | значение `ADMIN_PASSWORD_HASH` из `.env.local` |

---

## 5. Entry Criteria

- [ ] `npm run build` завершается без ошибок
- [ ] `npm run seed` выполнен, тестовые аккаунты созданы
- [ ] Dev-сервер запущен (`npm run dev`)
- [ ] `.env.local` содержит `SESSION_SECRET` и `ADMIN_PASSWORD_HASH`
- [ ] CSS-переменные используются вместо hardcoded цветов (проверено design-watcher)

---

## 6. Exit Criteria

- [ ] Все P0 тест-кейсы прошли (100%)
- [ ] ≥ 90% P1 тест-кейсов прошли
- [ ] Нет открытых критических багов (P0/P1 без workaround)
- [ ] Smoke suite прошёл полностью
- [ ] Responsive проверен на 375/768/1024px
- [ ] Accessibility checklist пройден (TC-UI-001, TC-UI-008, TC-UI-010)

---

## 7. Risk Assessment

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Сломана аутентификация | Средняя | Критическое | SMOKE-001..003 в каждом деплое |
| RESTRICT при удалении версии с комментариями | Средняя | Высокое | TC-AD-034 |
| Race condition в toggle-голосовании | Низкая | Среднее | TC-R-024 (параллельные запросы) |
| XSS через MDX-контент | Низкая | Критическое | TC-SEC-001 |
| Утечка данных ревью (приватные комментарии) | Низкая | Критическое | TC-SEC-004..005 |
| Rate-limit не работает | Низкая | Высокое | TC-R-023 |
| Сложная миграция reviewComments (assignmentId → sessionId) | Средняя | Высокое | backfill-скрипт + регрессионный тест |

---

## 8. Test Deliverables

| Артефакт | Файл |
|----------|------|
| Тест-план | `testing/TEST-PLAN.md` (этот файл) |
| Тест-кейсы Гость | `testing/test-cases/TC-GUEST.md` |
| Тест-кейсы Читатель | `testing/test-cases/TC-READER.md` |
| Тест-кейсы Автор | `testing/test-cases/TC-AUTHOR.md` |
| Тест-кейсы Ревьюер | `testing/test-cases/TC-REVIEWER.md` |
| Тест-кейсы Админ | `testing/test-cases/TC-ADMIN.md` |
| Тест-кейсы UI/UX | `testing/test-cases/TC-UI.md` |
| Smoke-набор | `testing/smoke/SMOKE-SUITE.md` |
| Regression-набор | `testing/regression/REGRESSION-SUITE.md` |

---

## 9. Coverage Matrix

| Группа | US | TC файл | TC кол-во | Приоритеты |
|--------|----|---------|-----------|------------|
| Гость | US-G1..G9 | TC-GUEST.md | ~20 | P0–P2 |
| Читатель | US-R1..R13 | TC-READER.md | ~35 | P0–P2 |
| Автор | US-A1..A20 | TC-AUTHOR.md | ~45 | P0–P2 |
| Ревьюер | US-RV1..RV16 | TC-REVIEWER.md | ~35 | P0–P2 |
| Админ | US-AD1..AD29 | TC-ADMIN.md | ~55 | P0–P2 |
| UI/UX | — | TC-UI.md | 15 | P0–P2 |
| Smoke | — | SMOKE-SUITE.md | 18 | P0 |
| Regression | — | REGRESSION-SUITE.md | 79 | P0–P1 |

---

## 10. Test Execution Schedule

| Этап | Когда | Набор |
|------|-------|-------|
| Smoke | Каждый деплой (5–10 мин) | SMOKE-SUITE |
| Санитарная проверка | После hotfix (15 мин) | Smoke + затронутый модуль |
| Targeted regression | После feature PR (30–60 мин) | Затронутые роли |
| Полный регресс | Перед релизом (3–4 ч) | Все TC |

---

## 11. Критические граничные случаи (обязательно проверить)

| # | Сценарий | TC |
|---|----------|----|
| 1 | RESTRICT: удаление `articleVersion` с публичными комментариями | TC-AD-034 |
| 2 | `isBlocked=1` → cascade unpublish всех статей автора | TC-AD-028 |
| 3 | Дублирование назначения ревью (409) | TC-A-034, TC-AD-045 |
| 4 | 15-минутное окно редактирования комментария | TC-R-010, TC-R-011 |
| 5 | Ревьюер видит версии только до даты назначения | TC-RV-025 |
| 6 | Слаг занят другой статьёй | TC-A-010, TC-AD-009 |
| 7 | Автор не может публиковать при `isBlocked=1` | TC-A-013 |
| 8 | Вердикт обязателен при завершении ревью | TC-RV-020 |
| 9 | `commentingBlocked` блокирует и комментарии, и вотинг | TC-R-023 |
| 10 | Upload: Content-Length ≤ 2 МБ, magic bytes валидация | TC-A-040, TC-AD-054 |
| 11 | Дата планирования в будущем | TC-A-042, TC-AD-051 |
| 12 | Резолв/переоткрытие заблокировано при `completed`/`declined` | TC-A-046, TC-RV-028 |
