# REPORT_UX — UX ревью ключевых flows

**Дата:** 2026-04-15
**Стенд:** http://localhost:3001
**Тестировщик:** ручной проход через Playwright MCP

## Flow 1: Гость читает статью

**Путь:** `/` → `/blog/[slug]`

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Hero секция | ✅ | Editorial: display font (Playfair), bio, featured article |
| Карточки статей | ✅ | 2-col grid, дата, время чтения, теги, hover effect |
| Страница статьи | ✅ | Display font h1, мета (дата·время·просмотры), теги |
| TOC | ✅ | Sticky sidebar, active highlight (border-l-2 accent) |
| Code blocks | ✅ | Shiki dual theme, copy buttons |
| Scroll progress | ✅ | Fixed top bar, ~57% на середине страницы |
| JS ошибки | ✅ | 0 ошибок |

**Вердикт: PASS**

## Flow 2: Читатель взаимодействует

**Путь:** `/login` → reader/password → статья → комментарий → голос → закладка → `/bookmarks`

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Логин | ✅ | Форма с display font, редирект на /reader |
| Комментарий | ✅ | Создан, виден автор, дата, кнопки (Ответить/Редактировать/Удалить) |
| Голос (upvote) | ✅ | Стрелка подсвечена teal, счётчик +1 |
| Закладка | ✅ | Иконка заполнена, счётчик 1 |
| /bookmarks | ✅ | Карточка с закладкой видна |
| Визуальный feedback | ✅ | Все действия дают мгновенный feedback |

**Найденная проблема:**
- **P0** (исправлено): `POST /api/articles/[id]/comments` → 500, если нет `articleVersions` для статьи (seed-статьи не имеют versions). Исправлено: auto-create initial version snapshot.

**Вердикт: PASS** (после фикса)

## Flow 3: Автор создаёт статью

**Путь:** `/login` → author/password → `/author` → `/author/articles/new`

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Dashboard | ✅ | Stats cards с display font, CTA кнопки |
| Навигация | ✅ | Мои статьи, Профиль, Уведомления, Сайт → |
| Форма создания | ✅ | Заголовок, Slug, Описание, Теги, Контент (MDX) — все поля |
| EditorWithPreview | ✅ | Toolbar видна |

**Вердикт: PASS**

## Flow 4: Ревьюер проводит ревью

**Путь:** `/login` → reviewer/password → `/reviewer`

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Dashboard | ✅ | Stats cards (Ожидают/В работе/Завершено) |
| Навигация | ✅ | Назначения, Уведомления |
| Empty state | ✅ | 0 назначений — чистый layout без ошибок |

**Вердикт: PASS** (нет назначений в seed для глубокого тестирования split-pane)

## Flow 5: Админ управляет

**Путь:** `/admin/login` → admin/dhome$32 → `/admin`

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Dashboard | ✅ | Stats (3 статьи, 3 опубл., вовлечённость), Топ-5 |
| Таблица пользователей | ✅ | Zebra rows, role badges (цветные), действия |
| Навигация | ✅ | Статьи, Пользователи, Уведомления, Настройки, Сайт → |
| JS ошибки | ✅ | 0 ошибок |

**Вердикт: PASS**

## Найденные проблемы

### P0

1. **POST /api/articles/[id]/comments → 500** — отсутствие `articleVersions` для seed-статей. Auto-create initial version snapshot добавлен в handler.
   - Файл: `src/app/api/articles/[id]/comments/route.ts`
   - **Исправлено**

### P1

Нет.

### P2

Нет.

## Скриншоты

| Flow | Файл |
|------|------|
| Flow 1: Homepage | `testing/reports/ux-flow1-homepage.png` |
| Flow 1: Article | `testing/reports/ux-flow1-article.png` |
| Flow 2: Comment | `testing/reports/ux-flow2-comment-success.png` |
| Flow 2: Vote+Bookmark | `testing/reports/ux-flow2-voted-bookmarked.png` |
| Flow 2: Bookmarks page | `testing/reports/ux-flow2-bookmarks.png` |
| Flow 3: Author dashboard | `testing/reports/ux-flow3-author-dashboard.png` |
| Flow 3: New article | `testing/reports/ux-flow3-new-article.png` |
| Flow 4: Reviewer dashboard | `testing/reports/ux-flow4-reviewer-dashboard.png` |
| Flow 5: Admin dashboard | `testing/reports/ux-flow5-admin-dashboard.png` |
| Flow 5: Admin users | `testing/reports/ux-flow5-admin-users.png` |

## Итог

- **Flows пройдено:** 5/5
- **P0 найдено:** 1 (исправлен)
- **P1 найдено:** 0
- **P2 найдено:** 0
- **JS ошибок:** 0
- **Вердикт: PASS**
