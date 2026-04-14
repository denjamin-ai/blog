# Прогресс: Система ревью и комментариев

## Фаза 1 — Схема базы данных ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| Добавлено 6 таблиц в `src/lib/db/schema.ts` | ✅ |
| Сгенерирована миграция `drizzle/0001_third_sway.sql` | ✅ |
| Миграция применена к локальной БД | ✅ |
| Тестовый ревьер добавлен в `seed.ts` | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Добавленные таблицы

| Таблица | Столбцов | Индексов | FK |
|---------|----------|----------|-----|
| `users` | 7 | 1 (email unique) | 0 |
| `review_assignments` | 8 | 2 | 3 |
| `review_comments` | 10 | 0 | 2 |
| `public_comments` | 9 | 2 | 3 |
| `article_changelog` | 6 | 0 | 1 |
| `notifications` | 7 | 2 | 1 |

### Тестовые данные

Seed создаёт тестового ревьера:
- email: `reviewer@example.com`
- password: `reviewer123`
- role: `reviewer`

---

## Аудит безопасности (security-reviewer)

> Примечание: агент `@security-reviewer` — кастомный агент проекта, недоступен через
> Agent SDK (только `Bash`, `Read`, `Grep` инструменты). Проведён ручной аудит по чеклисту.

### ✅ Критических уязвимостей не обнаружено

#### Foreign Keys — корректность

| FK | onDelete | Оценка |
|----|----------|--------|
| `article_changelog.article_id` → `articles.id` | CASCADE | ✅ Changelog удаляется со статьёй |
| `notifications.recipient_id` → `users.id` | CASCADE | ✅ Уведомления чистятся при удалении пользователя |
| `public_comments.article_id` → `articles.id` | CASCADE | ✅ |
| `public_comments.article_version_id` → `article_versions.id` | **RESTRICT** | ✅ Нельзя удалить версию с комментариями |
| `public_comments.author_id` → `users.id` | CASCADE | ✅ Комментарии удаляются вместе с пользователем |
| `review_assignments.article_id` → `articles.id` | CASCADE | ✅ |
| `review_assignments.article_version_id` → `article_versions.id` | CASCADE | ✅ |
| `review_assignments.reviewer_id` → `users.id` | CASCADE | ✅ |
| `review_comments.assignment_id` → `review_assignments.id` | CASCADE | ✅ |
| `review_comments.author_id` → `users.id` | SET NULL | ✅ Комментарий сохраняется, автор анонимизируется |

#### Эскалация привилегий

- ✅ Admin идентифицируется исключительно через `session.isAdmin` (iron-session + env `ADMIN_PASSWORD_HASH`).
  Таблица `users` не участвует в admin-аутентификации — `requireAdmin()` не проверяет БД.
- ✅ Reviewer/reader не могут получить `isAdmin=true` через схему: сессия устанавливается
  только в `/api/auth` (POST) через сравнение с `ADMIN_PASSWORD_HASH`.
- ✅ Поле `role` enum ограничено Drizzle (`"reviewer" | "reader"`) на уровне приложения.

#### Хранение паролей

- ✅ Поле `password_hash` — bcrypt через `bcryptjs` (уже в проекте).
- ✅ Seed использует `bcrypt.hash("reviewer123", 10)` — 10 раундов (соответствует OWASP).
- ✅ Hash никогда не должен возвращаться в API-ответах — enforced при реализации Phase 2
  (GET /api/admin/users должен exclude passwordHash).

#### Инварианты двойных флагов

| Инвариант | Уровень | Статус |
|-----------|---------|--------|
| `isAdminComment=1` → `authorId IS NULL` | Приложение | ⚠️ Нет DB CHECK (SQLite ограничение) |
| `isAdminRecipient=1` → `recipientId IS NULL` | Приложение | ⚠️ Нет DB CHECK (SQLite ограничение) |

**SQLite не поддерживает многоколоночные CHECK constraints** в синтаксисе Drizzle для Turso.
Инварианты обязательно проверять в API-обработчиках при вставке/обновлении.

#### Соответствие схемы и миграции

Проверено вручную: `drizzle/0001_third_sway.sql` полностью соответствует `schema.ts`.
Все FK, индексы, типы и DEFAULT значения совпадают.

### Сводка

| Уровень | Кол-во | Описание |
|---------|--------|----------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 2 | Инварианты isAdminComment/isAdminRecipient без DB CHECK — только app-layer |

**Вердикт: ✅ ГОТОВО К СЛЕДУЮЩЕЙ ФАЗЕ**

---

---

## Фаза 2 — API-эндпоинты ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| Расширен `SessionData` в `src/lib/auth.ts` (userId, userRole) | ✅ |
| Добавлен хелпер `requireUser(role?)` | ✅ |
| `POST/DELETE /api/auth/user` — логин/логаут ревьера/читателя | ✅ |
| `GET/POST /api/admin/users` — список и создание пользователей | ✅ |
| `GET/PUT/DELETE /api/admin/users/[id]` — управление пользователем | ✅ |
| `GET/POST /api/admin/assignments` — назначения ревью (admin) | ✅ |
| `GET/PATCH/DELETE /api/admin/assignments/[id]` | ✅ |
| `GET /api/reviewer/assignments` — назначения ревьера | ✅ |
| `GET/PATCH /api/reviewer/assignments/[id]` — детали + смена статуса | ✅ |
| `GET/POST /api/assignments/[id]/review-comments` — тред ревью | ✅ |
| `PUT/DELETE /api/assignments/[id]/review-comments/[commentId]` | ✅ |
| `GET/POST /api/articles/[id]/comments` — публичные комментарии | ✅ |
| `PUT/DELETE /api/articles/[id]/comments/[commentId]` | ✅ |
| `GET/POST /api/articles/[id]/changelog` — журнал изменений | ✅ |
| `DELETE /api/articles/[id]/changelog/[entryId]` | ✅ |
| `GET /api/articles/[id]/versions` — история версий | ✅ |
| `GET /api/notifications` — уведомления admin/user | ✅ |
| `PATCH /api/notifications/[id]/read` — отметить одно прочитанным | ✅ |
| `POST /api/notifications/read-all` — отметить все прочитанными | ✅ |
| Расширен `PUT /api/articles/[id]` — saveMode, reviewerId, changelog | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/lib/auth.ts` | +SessionData fields, +requireUser() |
| `src/app/api/auth/user/route.ts` | Логин/логаут пользователя |
| `src/app/api/admin/users/route.ts` | CRUD пользователей (list + create) |
| `src/app/api/admin/users/[id]/route.ts` | CRUD пользователей (get + update + delete) |
| `src/app/api/admin/assignments/route.ts` | Назначения ревью (admin) |
| `src/app/api/admin/assignments/[id]/route.ts` | Назначение ревью по id (admin) |
| `src/app/api/reviewer/assignments/route.ts` | Список назначений ревьера |
| `src/app/api/reviewer/assignments/[id]/route.ts` | Детали + смена статуса (ревьер) |
| `src/app/api/assignments/[id]/review-comments/route.ts` | Тред ревью-комментариев |
| `src/app/api/assignments/[id]/review-comments/[commentId]/route.ts` | Редактирование/удаление комментария ревью |
| `src/app/api/articles/[id]/comments/route.ts` | Публичные комментарии |
| `src/app/api/articles/[id]/comments/[commentId]/route.ts` | Ред./удаление публичного комментария |
| `src/app/api/articles/[id]/changelog/route.ts` | Журнал изменений статьи |
| `src/app/api/articles/[id]/changelog/[entryId]/route.ts` | Удаление записи changelog |
| `src/app/api/articles/[id]/versions/route.ts` | История версий (admin + reviewer) |
| `src/app/api/notifications/route.ts` | Уведомления |
| `src/app/api/notifications/[id]/read/route.ts` | Отметить одно уведомление прочитанным |
| `src/app/api/notifications/read-all/route.ts` | Отметить все уведомления прочитанными |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| `passwordHash` никогда не возвращается в ответах | `GET /api/admin/users`, `GET /api/admin/users/[id]` — explicit select |
| Admin-сессия не может быть установлена через `/api/auth/user` | POST проверяет `session.isAdmin !== true` |
| Ревьер видит только свои назначения | reviewer routes: `assignment.reviewerId === session.userId` |
| Публичный комментарий: глубина ≤ 2 | POST проверяет `parent.parentId !== null → 400` |
| Окно редактирования публичного комментария: 15 мин | PUT проверяет `now - comment.createdAt > 900 → 403` |
| `isAdminComment=1` → `authorId=null` | enforced при вставке в review-comments |
| `isAdminRecipient=1` → `recipientId=null` | enforced при вставке уведомлений |

---

---

## Фаза 3 (частично) — Admin UI: пользователи ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/app/admin/(protected)/users/page.tsx` — список пользователей | ✅ |
| `src/app/admin/(protected)/users/delete-button.tsx` — клиентский компонент удаления | ✅ |
| `src/app/admin/(protected)/users/loading.tsx` | ✅ |
| `src/app/admin/(protected)/users/error.tsx` | ✅ |
| `src/app/admin/(protected)/users/new/page.tsx` — форма создания | ✅ |
| `src/app/admin/(protected)/users/new/loading.tsx` | ✅ |
| `src/app/admin/(protected)/users/[id]/page.tsx` — форма редактирования | ✅ |
| `src/app/admin/(protected)/users/[id]/loading.tsx` | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| `passwordHash` не возвращается клиенту | API исключает поле явным `select`; форма редактирования не запрашивает и не отображает хеш |
| Пустой пароль при PUT не меняет существующий | `users/[id]/page.tsx` включает `password` в тело только если поле непустое |
| Дубликат email → понятная ошибка 409 | Оба клиентских компонента обрабатывают `res.status === 409` отдельно |

---

---

## Фаза 3 (продолжение) — Admin UI: workflow ревью ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/components/reviewer-picker-modal.tsx` — модальный поиск ревьера | ✅ |
| `src/app/admin/(protected)/articles/[id]/page.tsx` — кнопка "На ревью", блок назначений | ✅ |
| `src/app/admin/(protected)/articles/[id]/review/page.tsx` — страница ревью | ✅ |
| `src/app/admin/(protected)/articles/[id]/review/assignment-thread.tsx` — тред комментариев | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| Назначение создаётся только через `requireAdmin()` | `PUT /api/articles/[id]` — первая строка; `review/page.tsx` — явный вызов |
| Reviewer ID валидируется на сервере | API проверяет `users.role === "reviewer"` и отсутствие активного назначения |
| Комментарии: доступ только admin или assigned reviewer | `resolveAccess()` в `/api/assignments/[id]/review-comments` |
| PATCH статуса назначения только для admin | `requireAdmin()` в `/api/admin/assignments/[id]` |

---

---

## Фаза 4 — Reviewer UI ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/app/login/page.tsx` — страница входа для ревьеров/читателей | ✅ |
| `src/components/notification-badge.tsx` — polling badge (30s, `/api/notifications?unread=1`) | ✅ |
| `src/app/reviewer/(protected)/layout.tsx` — layout с `requireUser("reviewer")` и навигацией | ✅ |
| `src/app/reviewer/(protected)/page.tsx` — дашборд с count по статусам | ✅ |
| `src/app/reviewer/(protected)/assignments/page.tsx` — список назначений с фильтром по статусу | ✅ |
| `src/app/reviewer/(protected)/assignments/[id]/review-view.tsx` — split layout (MDX + панель комментариев) | ✅ |
| `src/app/reviewer/(protected)/assignments/[id]/page.tsx` — server component: MDX compile + данные | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |
| `npm run lint` — 0 ошибок (6 pre-existing warnings) | ✅ OK |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| Только роль `reviewer` получает доступ | `requireUser("reviewer")` в layout + каждой server page; `Response` (403) → `redirect("/login")` |
| Ревьер видит только свои назначения | `assignment.reviewerId !== session.userId` → `notFound()` в `assignments/[id]/page.tsx` |
| API уже проверяет принадлежность | `reviewerId === session.userId` в каждом reviewer API route |
| Status transitions валидируются | PATCH принимает только допустимые переходы (pending→accepted/declined, accepted→completed/declined) |

### Функциональность review-view.tsx

| Фича | Реализация |
|------|------------|
| Split layout | `flex h-[calc(100vh-57px)]`; статья: `flex-1 overflow-y-auto`; панель: `w-[400px] shrink-0` |
| Рендер MDX | `compileMDX()` на сервере, `children` передаётся в client component |
| Text selection → quote | `mouseup` listener на `articleRef`; находит ближайший heading выше выделения |
| Floating "Процитировать" | `fixed z-50` кнопка у позиции выделения |
| Цитата в форме | `quotedText` + кнопка очистки; `quotedAnchor` = id заголовка |
| Кнопки действий | pending: Принять/Отклонить; accepted: Завершить/Отклонить; terminal states: read-only |
| Комментарии | GET при монтировании + после каждой отправки; sorted oldest→newest |
| Polling уведомлений | `NotificationBadge` в layout, 30s interval |

---

---

## Фаза 6 — Публичные комментарии ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| Исправлен `GET /api/articles/[id]/comments` — убран фильтр `isNull(deletedAt)` | ✅ |
| Добавлен JOIN с `users` для передачи `authorName` в ответе | ✅ |
| Добавлен `GET /api/auth/user` — возвращает `{ userId, userRole }` из сессии | ✅ |
| Добавлена анимация `animate-fade-in` в `globals.css` | ✅ |
| `src/components/comments/deleted-comment.tsx` | ✅ |
| `src/components/comments/version-warning.tsx` | ✅ |
| `src/components/comments/comment-form.tsx` | ✅ |
| `src/components/comments/comment-item.tsx` | ✅ |
| `src/components/comments/comment-section.tsx` | ✅ |
| Интеграция в `src/app/blog/[slug]/page.tsx` — `currentVersionId` + `<CommentSection>` | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |
| `npm run lint` — 0 ошибок (6 pre-existing warnings) | ✅ OK |

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/components/comments/comment-section.tsx` | Корневой клиентский компонент: загрузка, дерево комментариев, auth state |
| `src/components/comments/comment-item.tsx` | Один комментарий + ответы: редактирование, удаление, reply form |
| `src/components/comments/comment-form.tsx` | Форма отправки нового комментария или ответа |
| `src/components/comments/version-warning.tsx` | Amber-предупреждение о версии (comment/reply variant), dismissible |
| `src/components/comments/deleted-comment.tsx` | Плейсхолдер `[удалено]` |

### Ключевые инварианты

| Инвариант | Где проверяется |
|-----------|----------------|
| Только `reader` может писать комментарии | `POST /api/articles/[id]/comments` — `session.userRole !== "reader"` → 401 |
| Окно редактирования 15 мин | PUT — `now - createdAt > 900` → 403; клиент скрывает кнопку аналогично |
| Мягкое удаление сохраняет тред | GET возвращает удалённые; клиент рендерит `[удалено]` + ответы |
| Stale detection | `comment.isStale` из API; `<VersionWarning>` при `isStale === true` |
| `authorName` скрывается при удалении | API: `deletedAt ? null : authorName` |
| Глубина вложенности ≤ 2 | POST проверяет `parent.parentId !== null → 400`; кнопка "Ответить" только на `depth=0` |

---

---

## Фаза 7 — Журнал изменений ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/components/article-changelog.tsx` — server component с аккордеоном | ✅ |
| `src/app/blog/[slug]/page.tsx` — интеграция `<ArticleChangelog>` | ✅ |
| `src/app/admin/(protected)/articles/[id]/page.tsx` — секция "Журнал изменений" | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/components/article-changelog.tsx` | Server component: "Последнее обновление" + CSS-only аккордеон `<details>/<summary>` |

### Функциональность

| Фича | Реализация |
|------|------------|
| "Последнее обновление" | Выше аккордеона, в SSR HTML — виден поисковикам без JS |
| CSS-only аккордеон | `<details>/<summary>`, без JS |
| Сортировка | `entryDate DESC` (новые сверху) — обеспечивается API |
| Dark mode | CSS-переменные `--muted-foreground`, `--border`, `--foreground` |
| Admin: список существующих записей | Загрузка через `GET /api/articles/[id]/changelog` при монтировании |
| Admin: удаление записи | `DELETE /api/articles/[id]/changelog/[entryId]`, удаление из локального стейта |
| Admin: pending-записи | Staged локально, отправляются с `PUT /api/articles/[id]` при публикации |
| Admin: форма добавления | `<input type="date">` + раздел (опц.) + описание |

### Ключевые инварианты

| Инвариант | Где проверяется |
|-----------|----------------|
| Changelog-записи создаются только при публикации | pending entries → PUT body только при `newStatus === "published"` |
| API-валидация `entryDate` и `description` | `POST /api/articles/[id]/changelog` и PUT-обработчик (Фаза 2) |
| Видимость для поисковиков | `ArticleChangelog` — server component, SSR |

---

---

## Фаза 8 — История версий для ревьера ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/app/api/reviewer/assignments/[id]/versions/route.ts` — GET endpoint | ✅ |
| `src/app/reviewer/(protected)/assignments/[id]/versions/versions-timeline.tsx` — client timeline | ✅ |
| `src/app/reviewer/(protected)/assignments/[id]/versions/page.tsx` — server page | ✅ |
| `src/app/reviewer/(protected)/assignments/[id]/page.tsx` — ссылка "История версий" | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |
| `npm run lint` — 0 новых ошибок | ✅ OK |

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/app/api/reviewer/assignments/[id]/versions/route.ts` | Авторизованный GET: версии статьи до назначенной включительно |
| `src/app/reviewer/(protected)/assignments/[id]/versions/versions-timeline.tsx` | Client component: вертикальная timeline, expand/collapse MDX |
| `src/app/reviewer/(protected)/assignments/[id]/versions/page.tsx` | Server component: DB query + compileMDX для каждой версии |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| Ревьер видит только версии своего назначения | API: `assignment.reviewerId !== session.userId` → 403; page: `notFound()` |
| URL manipulation (чужой assignmentId) | И API, и page проверяют `reviewerId === session.userId` |
| Версии ограничены назначенной | `lte(articleVersions.createdAt, assignedVersion.createdAt)` |

### Функциональность

| Фича | Реализация |
|------|------------|
| Вертикальная timeline | `absolute` линия + `rounded-full` маркеры |
| Версия для ревью | Маркер `bg-accent border-accent` + бейдж "Версия для ревью" |
| Expand/collapse MDX | `useState<string\|null>` + `compileMDX()` server-side pre-compiled |
| Превью 200 символов | Стрип MDX-синтаксиса regex, `.slice(0, 200)` |
| "Без описания" | `changeNote ?? italic placeholder` |
| Пустой массив | Текст "Нет доступных версий" (без Загрузка...) |
| Навигация назад | `← Назад к ревью` + Link в page.tsx детали |

---

## Фаза 5 — Уведомления (UI) ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/app/admin/(protected)/layout.tsx` — ссылка "Уведомления" + `<NotificationBadge />` | ✅ |
| `src/app/admin/(protected)/notifications/page.tsx` — страница уведомлений admin | ✅ |
| `src/app/reviewer/(protected)/layout.tsx` — ссылка "Уведомления" + перенос badge | ✅ |
| `src/app/reviewer/(protected)/notifications/page.tsx` — страница уведомлений ревьера | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/app/admin/(protected)/notifications/page.tsx` | Список уведомлений admin: непрочитанные сверху, клик → mark-read + переход |
| `src/app/reviewer/(protected)/notifications/page.tsx` | Аналогичная страница для ревьера |

### Функциональность

| Фича | Реализация |
|------|------------|
| Polling badge | `NotificationBadge` (30s) в обоих layout'ах — уже был в reviewer, добавлен в admin |
| Группировка | Непрочитанные сверху (сортировка `isRead ASC, createdAt DESC`), разделитель "Прочитанные" |
| Клик по уведомлению | `PATCH /api/notifications/[id]/read` + `router.push(deepLink)` |
| Deep links (admin) | `assignment_*` / `review_comment_reply` → `/admin/articles/[articleId]/review` |
| Deep links (reviewer) | `assignment_created` / `review_comment_reply` → `/reviewer/assignments/[assignmentId]` |
| "Отметить все прочитанными" | `POST /api/notifications/read-all` → обновление списка |
| Нет уведомлений | Пустое состояние "Нет уведомлений" |
| Ошибки polling/fetch | Тихо игнорируются, нет ошибок пользователю |
| Badge = 0 | Badge не показывается (возвращает `null`) |
| Cleanup | `clearInterval` при unmount в `NotificationBadge` |
| payload | `JSON.parse` с try-catch в API, typed payload в компонентах |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| Admin видит только `isAdminRecipient=1` | `GET /api/notifications` — фильтр по `session.isAdmin` |
| Reviewer видит только свои (`recipientId = session.userId`) | `GET /api/notifications` — фильтр по `session.userId` |
| PATCH read — ownership check | `PATCH /api/notifications/[id]/read` проверяет `isAdminRecipient` vs `recipientId` |
| Нет cross-user access | API-level enforcement; страницы просто вызывают `/api/notifications` |

---

---

## Фаза 9 — Hardening ✅ ВЫПОЛНЕНА

**Дата:** 2026-04-12

### Что сделано

| Шаг | Результат |
|-----|-----------|
| `src/lib/rate-limit.ts` — скользящее окно 5 попыток / 15 мин на IP | ✅ |
| Rate limit подключён в `POST /api/auth/route.ts` (admin login) | ✅ |
| Rate limit подключён в `POST /api/auth/user/route.ts` (user login) | ✅ |
| Валидация email: `.trim().length === 0` check в user login | ✅ |
| Валидация password: минимальная длина ≥ 1 символ в обоих login-роутах | ✅ |
| Пагинация `GET /api/articles/[id]/comments` (`?page&limit`, root+replies) | ✅ |
| Пагинация `GET /api/notifications` (`?page&limit`, `createdAt DESC`) | ✅ |
| Pruning уведомлений: прочитанные старше 30 дней удаляются при GET | ✅ |
| `comment-section.tsx` — кнопка "Загрузить ещё", append-логика | ✅ |
| `notification-badge.tsx` — адаптирован к paginated response | ✅ |
| Admin notifications page — Prev/Next пагинация | ✅ |
| Reviewer notifications page — Prev/Next пагинация | ✅ |
| `review-comments` POST — max length: content 10k, quotedText 2k, quotedAnchor 200 | ✅ |
| `reviewer/assignments/[id]` PATCH — `.trim()` + max length 5k для reviewerNote | ✅ |
| `admin/assignments/[id]` PATCH — `typeof status !== "string"` check | ✅ |
| `npm run build` — TypeScript + сборка | ✅ OK |
| `npm run lint` — 0 новых ошибок | ✅ OK |

### Ключевые инварианты безопасности

| Инвариант | Где проверяется |
|-----------|----------------|
| Max 5 login attempts per 15 min per IP | `checkRateLimit()` в auth routes |
| IP из `x-forwarded-for` или `x-real-ip` | `getClientIP()` в rate-limit.ts |
| Pruning только своих уведомлений | `isAdminRecipient=1` для admin, `recipientId=session.userId` для user |
| Пагинация комментариев: root+replies вместе | `inArray(parentId, rootIds)` — нет осиротевших ответов |
| Числовые параметры page/limit: parseInt + NaN guard + clamp | Оба paginated endpoints |
