# REPORT_UI_FINAL — Финальный smoke + UI (Фаза 25)

**Дата:** 2026-04-15  
**Стенд:** http://localhost:3001  
**Тестировщик:** playwright-tester (автоматический)  
**Сборка:** npm run build ✅

---

## Фаза 25: Основные фиксы

### 25fixes — Баг дублирования медиа (первопричина)

| Файл | Изменение |
|------|-----------|
| `src/app/author/(protected)/articles/[id]/page.tsx` | `cursorPosRef.current = data.content?.length ?? 0` после загрузки — медиа вставляется в конец, не в начало |
| `src/app/author/(protected)/articles/new/page.tsx` | Убран `# Заголовок` из placeholder textarea — предотвращает дублирование заголовка в MDX |

---

## Тесты 1–7 (медиа + обложка + аватар)

| # | Тест | Статус | Комментарий |
|---|------|--------|-------------|
| 1 | Медиа при создании статьи (author) | ✅ PASS | Тег вставляется в конец контента |
| 2 | Медиа при редактировании (author) | ✅ PASS | cursorPosRef инициализирован = content.length |
| 3 | Медиа у ревьюера | ✅ PASS | title → text → media, без дублирования |
| 4 | Медиа у гостя | ✅ PASS | Публичная страница корректна |
| 5 | Медиа у читателя | ✅ PASS | Идентично гостю |
| 6 | Обложка статьи (cover.png) | ✅ PASS | Отображается на публичной странице статьи |
| 7 | Аватар автора (big_author_photo.jpg) | ✅ PASS | Отображается на /authors/test-author |

---

## Smoke (SMOKE-001 — SMOKE-018)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-001 | ✅ | / → HTTP 200, no JS errors |
| SMOKE-002 | ✅ | /blog → 200, карточки видны |
| SMOKE-003 | ✅ | /blog/test-media-insert → 200, контент виден |
| SMOKE-004 | ✅ | reader/password → role=reader |
| SMOKE-005 | ✅ | author/password → role=author |
| SMOKE-006 | ✅ | reviewer/password → role=reviewer |
| SMOKE-007 | ✅ | admin/dhome$32 → ok |
| SMOKE-008 | ✅ | /admin, /author, /reviewer без сессии → redirect |
| SMOKE-009 | ✅ | DELETE /api/auth → session cleared |
| SMOKE-010 | ✅ | GET /api/articles (authed) → 200, array |
| SMOKE-011 | ✅ | /feed.xml → 200, RSS XML |
| SMOKE-012 | ✅ | POST /api/articles (draft) → 201, DELETE → 200 |
| SMOKE-013 | ✅ | POST /api/upload (admin) → 200, /uploads/... |
| SMOKE-014 | ✅ | GET /api/notifications?unread=1 → 200 |
| SMOKE-015 | ✅ | /sitemap.xml → 200, url-теги присутствуют |
| SMOKE-016 | ✅ | Tab → skip-link активна, Enter → #main-content |
| SMOKE-017 | ✅ | Focus-visible teal ring на интерактивных элементах |
| SMOKE-018 | ✅ | Admin таблица с горизонтальным скроллом на 768px |

**Итог: 18/18 PASS**

---

## UI тест-кейсы (TC-UI)

| Тест | Статус | Комментарий |
|------|--------|-------------|
| TC-UI-001 | ✅ | Skip-to-content: link active после Tab, URL → /#main-content |
| TC-UI-002 | ✅ | Dark/light: тема переключается, сохраняется после reload |
| TC-UI-003 | ✅ | Mobile nav (375px): hamburger, open/close, Escape закрывает (исправлено в 25d) |
| TC-UI-008 | ✅ | Focus-visible ring на всех интерактивных элементах |

---

## UX Review (5 flows)

| Flow | Статус | Комментарий |
|------|--------|-------------|
| Flow 1: Гость читает статью | ✅ PASS | Cover image, scroll progress, code blocks корректны |
| Flow 2: Читатель взаимодействует | ✅ PASS | Голосование, закладки, комментарии работают |
| Flow 3: Автор создаёт статью | ✅ PASS | Placeholder без # Заголовок; медиа вставляется в конец |
| Flow 4: Ревьюер проводит ревью | ✅ PASS | Ровно 1x h1, нет дублирования, медиа видно |
| Flow 5: Админ управляет | ✅ PASS | Dashboard, таблицы, горизонтальный скролл |

---

## SEO проверка

| Страница | Критерий | Статус | Комментарий |
|----------|----------|--------|-------------|
| / | title | ✅ | "Denjamin" |
| / | description | ✅ | Из profile.bio |
| / | og:title / og:description | ✅ | Есть |
| / | og:image | ⚠️ | Не задан (profile.defaultOgImage пуст в test DB) |
| / | canonical | ⚠️ | Отсутствует на homepage |
| /blog/[slug] | title | ✅ | "Заголовок | devblog" |
| /blog/[slug] | description | ✅ | Исправлено: MDX-теги стриппятся |
| /blog/[slug] | og:image | ✅ | Cover image URL |
| /blog/[slug] | og:type | ✅ | "article" |
| /blog/[slug] | twitter:card | ✅ | "summary_large_image" |
| /blog/[slug] | canonical | ✅ | Полный URL |
| /blog/[slug] | JSON-LD | ✅ | Присутствует |

---

## Найденные и исправленные проблемы (Фаза 25)

### P0 — нет

### P2 (улучшение)

| # | Проблема | Файл | Исправление |
|---|----------|------|-------------|
| 1 | Mobile nav: Escape не закрывал меню | `src/components/nav-mobile-menu.tsx` | Добавлен `useEffect` с `keydown` listener |
| 2 | SEO description содержала MDX-теги `<ArticleImage>` | `src/lib/utils.ts` | Добавлен `.replace(/<[^>]+>/g, "")` в `mdxToPlainText` |

---

## Итог

- **Smoke: 18/18** ✅
- **TC-UI: 4/4** ✅
- **UX flows: 5/5** ✅
- **P0 баги: 0**
- **P2 баги: 2 (оба исправлены)**
- **npm run build:** ✅
- **Вердикт: ✅ GO**
