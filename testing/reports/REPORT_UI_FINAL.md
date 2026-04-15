# REPORT_UI_FINAL — Повторный smoke после фиксов

**Дата:** 2026-04-15
**Стенд:** http://localhost:3001
**Тестировщик:** playwright-tester (автоматический)

## Исправления перед повторным прогоном
1. P0: Удалён onClick в Server Component (`article-card.tsx:153`)
2. P2: Добавлен `tabIndex={-1}` на `<main>` для skip-link focus
3. HIGH SEO: Восстановлен `generateMetadata()` в `page.tsx`
4. P0: Auto-create initial `articleVersion` при первом комментарии

## Результаты

### Smoke (SMOKE-001 — SMOKE-018)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-001 | ✅ | `/` → 200, главная загружается |
| SMOKE-002 | ✅ | `/blog` → 200, 3 карточки статей |
| SMOKE-003 | ✅ | `/blog/[slug]` → 200, MDX-контент, progressbar |
| SMOKE-004 | ✅ | reader/password → /reader |
| SMOKE-005 | ✅ | author/password → /author |
| SMOKE-006 | ✅ | reviewer/password → /reviewer |
| SMOKE-007 | ✅ | admin/dhome$32 → /admin |
| SMOKE-008 | ✅ | Защита роутов: 307 без сессии |
| SMOKE-009 | ✅ | Logout → редирект |
| SMOKE-010 | ✅ | GET /api/articles → 200 JSON |
| SMOKE-011 | ✅ | /feed.xml → 200, RSS XML |
| SMOKE-012 | ✅ | POST /api/articles → 201, удалён |
| SMOKE-013 | ✅ | POST /api/upload → 200, /uploads/... |
| SMOKE-014 | ✅ | GET /api/notifications?unread=1 → 200 |
| SMOKE-015 | ✅ | /sitemap.xml → 200 |
| SMOKE-016 | ✅ | Tab → skip-link видна |
| SMOKE-017 | ✅ | Tab → focus-visible ring (accent outline) |
| SMOKE-018 | ✅ | /admin/articles 768px → без обрезки |

### UI smoke (SMOKE-UI-001 — SMOKE-UI-003)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-UI-001 | ✅ | Dark/light тема переключается, classList.contains('dark') |
| SMOKE-UI-002 | ✅ | Mobile 375px: hamburger → меню → ссылки |
| SMOKE-UI-003 | ✅ | Skip-link → Tab → видна → Enter → фокус на main |

## Замечания (INFO, не блокирующие)
1. /feed.xml содержит `https://localhost:3000` — NEXT_PUBLIC_BASE_URL для тестового стенда, на проде будет корректный URL
2. GET /api/articles требует авторизацию — ожидаемое поведение

## Итог
- **Прошли: 21/21**
- **Провалились: 0**
- **Вердикт: GO**
