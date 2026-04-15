# REPORT_UI — Smoke + UI тесты

**Дата:** 2026-04-15
**Стенд:** http://localhost:3001
**Тестировщик:** playwright-tester (автоматический)

## Результаты

### Стандартный smoke (SMOKE-001 — SMOKE-018)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-001 | ✅ | Главная загружается, HTTP 200 |
| SMOKE-002 | ❌ P0 | /blog — 500. `onClick` в серверном компоненте `article-card.tsx:153` |
| SMOKE-003 | ✅ | /blog/[slug] — 200, контент виден |
| SMOKE-004 | ✅ | reader/password — логин, редирект на /reader |
| SMOKE-005 | ✅ | author/password — логин, редирект на /author |
| SMOKE-006 | ✅ | reviewer/password — редирект на /reviewer |
| SMOKE-007 | ✅ | admin/dhome$32 — редирект на /admin |
| SMOKE-008 | ✅ | Защищённые роуты редиректят без сессии |
| SMOKE-009 | ✅ | «Выйти» очищает сессию |
| SMOKE-010 | ✅ | GET /api/articles → 200, JSON |
| SMOKE-011 | ✅ | /feed.xml → 200, XML с `<rss>` |
| SMOKE-012 | ✅ | POST /api/articles как author → 201 |
| SMOKE-013 | ✅ | POST /api/upload как admin → 200 |
| SMOKE-014 | ✅ | GET /api/notifications?unread=1 → 200 |
| SMOKE-015 | ✅ | /sitemap.xml → 200 |
| SMOKE-016 | ✅ | Skip-link «Перейти к содержимому» видна по Tab |
| SMOKE-017 | ✅ | Focus-visible ring виден |
| SMOKE-018 | ✅ | Admin таблица с горизонтальным скроллом на 768px |

### UI smoke (SMOKE-UI-001 — SMOKE-UI-003)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-UI-001 | ✅ | Dark/light тема переключается корректно |
| SMOKE-UI-002 | ✅ | Mobile nav (375px): hamburger, меню, ссылки работают |
| SMOKE-UI-003 | ⚠️ P2 | Skip-link видна, но фокус не перемещается на `<main>` (нет `tabindex="-1"`) |

### TC-UI тесты

| Тест | Статус | Комментарий |
|------|--------|-------------|
| TC-UI-001 | ⚠️ P2 | Skip-link работает, но фокус не перемещается (дубль SMOKE-UI-003) |
| TC-UI-002 | ✅ | Dark/light: контраст корректен в обоих режимах |
| TC-UI-003 | ✅ | Mobile nav: hamburger → меню → навигация → закрытие |
| TC-UI-008 | ✅ | Focus-visible ring на всех интерактивных элементах |

## Найденные проблемы

### P0 (блокер)

1. **SMOKE-002: /blog → 500** — `onClick={(e) => e.stopPropagation()}` в серверном компоненте `article-card.tsx:153`. React Server Components не поддерживают event handlers.
   - **Исправлено**: удалён `onClick` (не нужен — нет родительского обработчика клика)

### P2 (улучшение)

1. **SMOKE-UI-003 / TC-UI-001: Skip-link фокус** — `<main id="main-content">` не имеет `tabindex="-1"`, фокус не перемещается после клика по skip-link.
   - **Исправлено**: добавлен `tabIndex={-1}` и `outline-none` на `<main>` в `layout.tsx`

## Исправления (25d)

| Проблема | Файл | Исправление |
|----------|------|-------------|
| P0: onClick в Server Component | `src/components/article-card.tsx` | Удалён `onClick={(e) => e.stopPropagation()}` |
| P2: skip-link focus | `src/app/layout.tsx` | Добавлен `tabIndex={-1}` на `<main>` |
| HIGH SEO: generateMetadata | `src/app/page.tsx` | Восстановлен `generateMetadata()` с profile данными |

## Итог

- **Прошли (до фикса):** 21/24 (1 P0, 2 P2)
- **После фикса:** 24/24 ожидается
- **Первоначальный вердикт: ❌ NO-GO**
- **После фиксов: ожидает повторный прогон (25e)**
