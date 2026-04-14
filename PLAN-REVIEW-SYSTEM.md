# Система ревью и комментариев — Архитектурный план

## Обзор

Документ описывает архитектуру системы ревью и публичных комментариев поверх существующего блога.
Существующие таблицы (`articles`, `articleVersions`, `profile`, `profileVersions`) и admin-авторизация
(iron-session, `{ isAdmin: boolean }`) не ломаются — все изменения аддитивны.

---

## 1. Схема таблиц (Drizzle, dialect `turso`)

Все таблицы: `sqliteTable` из `drizzle-orm/sqlite-core`, ID через `ulid()`, timestamps — Unix seconds.

### 1.1 `users`

Хранит аккаунты ревьеров и читателей. Admin — не DB-пользователь, он определяется флагом `session.isAdmin`.

```ts
export const users = sqliteTable("users", {
  id:           text("id").primaryKey(),
  email:        text("email").notNull().unique(),
  name:         text("name").notNull(),
  role:         text("role", { enum: ["reviewer", "reader"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    integer("created_at").notNull(),
  updatedAt:    integer("updated_at").notNull(),
});
```

- Саморегистрация отсутствует — только admin создаёт пользователей.
- `email` — уникален; проверка уникальности на уровне приложения (по аналогии со `slug` у статей).
- Хеширование пароля — `bcryptjs` (уже в проекте).

---

### 1.2 `reviewAssignments`

Одна запись = одно «Отправить на ревью». Связывает ревьера с конкретным снимком версии статьи.

```ts
export const reviewAssignments = sqliteTable("review_assignments", {
  id:               text("id").primaryKey(),
  articleId:        text("article_id").notNull()
                      .references(() => articles.id, { onDelete: "cascade" }),
  articleVersionId: text("article_version_id").notNull()
                      .references(() => articleVersions.id, { onDelete: "cascade" }),
  reviewerId:       text("reviewer_id").notNull()
                      .references(() => users.id, { onDelete: "cascade" }),
  status:           text("status", {
                      enum: ["pending", "accepted", "declined", "completed"]
                    }).notNull().default("pending"),
  reviewerNote:     text("reviewer_note"),   // причина отклонения / итоговая заметка
  createdAt:        integer("created_at").notNull(),
  updatedAt:        integer("updated_at").notNull(),
});
```

Жизненный цикл: `pending` → `accepted` | `declined`; `accepted` → `completed`.

- `articleVersionId` фиксирует контент, который ревьер проверял, даже если статья потом изменилась.
- UNIQUE-ограничение на `(articleId, reviewerId)` не нужен: admin может назначить того же ревьера
  на новую версию. Защита от двойного клика — на уровне приложения (guard на pending-назначение).

---

### 1.3 `reviewComments`

Приватные комментарии в ходе ревью — видны только admin и назначенному ревьеру.

```ts
export const reviewComments = sqliteTable("review_comments", {
  id:             text("id").primaryKey(),
  assignmentId:   text("assignment_id").notNull()
                    .references(() => reviewAssignments.id, { onDelete: "cascade" }),
  authorId:       text("author_id")
                    .references(() => users.id, { onDelete: "set null" }),
  isAdminComment: integer("is_admin_comment").notNull().default(0), // 1 = написал admin
  content:        text("content").notNull(),
  quotedText:     text("quoted_text"),    // цитата из тела статьи (опционально)
  quotedAnchor:   text("quoted_anchor"),  // JSON: { paragraphIndex, charStart, charEnd }
  parentId:       text("parent_id"),      // ссылка на родительский комментарий (1 уровень)
  createdAt:      integer("created_at").notNull(),
  updatedAt:      integer("updated_at").notNull(),
});
```

- `isAdminComment = 1` означает: написал admin. `authorId` при этом — NULL.
- `isAdminComment = 0` означает: написал ревьер; `authorId` указывает на `users.id`.
- `quotedAnchor` — JSON-строка; читать через `JSON.parse` с try-catch.
  Формат: `{ "paragraphIndex": 3, "charStart": 120, "charEnd": 190 }`.
  В MDX-рендере блочным элементам добавляются `data-paragraph-index`, что позволяет прокрутить
  до нужного места даже если контент изменился после создания назначения.
- `parentId` — один уровень вложенности внутри ревью-треда; глубокое вложение не требуется.

---

### 1.4 `publicComments`

Публичные комментарии читателей к опубликованным статьям.

```ts
export const publicComments = sqliteTable("public_comments", {
  id:               text("id").primaryKey(),
  articleId:        text("article_id").notNull()
                      .references(() => articles.id, { onDelete: "cascade" }),
  articleVersionId: text("article_version_id").notNull()
                      .references(() => articleVersions.id, { onDelete: "restrict" }),
  authorId:         text("author_id").notNull()
                      .references(() => users.id, { onDelete: "cascade" }),
  content:          text("content").notNull(),
  parentId:         text("parent_id"),   // макс. 1 уровень вложенности; проверка в приложении
  createdAt:        integer("created_at").notNull(),
  updatedAt:        integer("updated_at").notNull(),
  deletedAt:        integer("deleted_at"), // мягкое удаление: показывать «[удалено]»
});
```

- `onDelete: "restrict"` на `articleVersionId` — нельзя удалить версию, к которой привязаны
  комментарии. Admin UI должен предупреждать об этом.
- `articleVersionId` фиксирует версию статьи, которую читал автор комментария. UI сравнивает
  это поле с текущей опубликованной версией и показывает предупреждение при расхождении.
- Вложенность: максимум 2 уровня (комментарий + ответы). POST-обработчик проверяет: если
  родительский комментарий сам имеет `parentId` — возвращает 400.
- `deletedAt` (мягкое удаление): сохраняет структуру треда, контент скрывается, показывается
  плейсхолдер «[удалено]».
- Анонимные комментарии запрещены: `authorId NOT NULL`, только аутентифицированные читатели.

---

### 1.5 `articleChangelog`

Ручные записи о публичных изменениях статьи — отдельно от автоматических снимков в `articleVersions`.

```ts
export const articleChangelog = sqliteTable("article_changelog", {
  id:          text("id").primaryKey(),
  articleId:   text("article_id").notNull()
                 .references(() => articles.id, { onDelete: "cascade" }),
  entryDate:   integer("entry_date").notNull(),  // Unix seconds (дата изменения)
  section:     text("section"),                  // название главы/раздела (опционально)
  description: text("description").notNull(),    // краткое описание что изменилось
  createdAt:   integer("created_at").notNull(),
});
```

- Полностью ручная курация: admin заполняет при публикации.
- `entryDate` — пользовательская дата изменения (может отличаться от `createdAt`).
- Записи immutable: если нужна правка — удалить и создать заново.

---

### 1.6 `notifications`

Внутренние уведомления (polling, без WebSocket/email).

```ts
export const notifications = sqliteTable("notifications", {
  id:               text("id").primaryKey(),
  recipientId:      text("recipient_id")
                      .references(() => users.id, { onDelete: "cascade" }),
  isAdminRecipient: integer("is_admin_recipient").notNull().default(0), // 1 = получатель admin
  type:             text("type", { enum: [
                      "assignment_created",    // ревьер: назначили на статью
                      "assignment_accepted",   // admin: ревьер принял
                      "assignment_declined",   // admin: ревьер отклонил
                      "review_completed",      // admin: ревью завершено
                      "review_comment_reply",  // ревьер: ответ на его комментарий
                      "public_comment_reply",  // читатель: ответ на его комментарий
                    ]}).notNull(),
  payload:          text("payload").notNull().default("{}"), // JSON: { articleId, assignmentId, ... }
  isRead:           integer("is_read").notNull().default(0),
  createdAt:        integer("created_at").notNull(),
});
```

- `isAdminRecipient = 1` и `recipientId = NULL` → уведомление для admin.
- `payload` — JSON-строка с контекстными ID для построения deep link. Читать с try-catch.
- Polling: клиент опрашивает `GET /api/notifications?unread=1` каждые 30 секунд, показывает badge.
- Индексы для производительности: `(recipient_id, is_read)` и `(is_admin_recipient, is_read)`.

---

### Граф зависимостей таблиц

```
articles ←── articleVersions ←── reviewAssignments ←── reviewComments
    ↑               ↑
    └─── publicComments (articleVersionId → RESTRICT)
    └─── articleChangelog

users ──→ reviewAssignments.reviewerId
users ──→ reviewComments.authorId (nullable, set null on delete)
users ──→ publicComments.authorId (cascade)
users ──→ notifications.recipientId (nullable, cascade)
```

---

## 2. API-эндпоинты

Паттерн: все admin-роуты начинают с `await requireAdmin()`,
пользовательские — с нового хелпера `await requireUser(role?)`.
Параметры маршрутов — `Promise<{...}>`, обязателен `await params` (Next.js 16).

### 2.1 Расширение сессии и авторизация

**Расширение `SessionData`** (аддитивное, без поломки):
```ts
export interface SessionData {
  isAdmin: boolean;               // существующий флаг
  userId?: string;                // новый
  userRole?: "reviewer" | "reader"; // новый
}
```

Инвариант: `isAdmin = true` и `userId` не могут быть установлены в одной сессии одновременно.

**Новый хелпер** в `src/lib/auth.ts`:
```ts
async function requireUser(role?: "reviewer" | "reader"): Promise<SessionData>
```
Редиректит на `/login` если `session.userId` отсутствует. Возвращает 403 если роль не совпадает.

| Метод | Путь | Auth | Тело | Описание |
|-------|------|------|------|----------|
| POST | `/api/auth/user` | — | `{ email, password }` | Логин ревьера/читателя. Проверяет что `session.isAdmin !== true`. |
| DELETE | `/api/auth/user` | User | — | Логаут пользователя. |

---

### 2.2 Управление пользователями (только admin)

| Метод | Путь | Тело/Query | Ответ |
|-------|------|-----------|-------|
| GET | `/api/admin/users` | `?search=` (ник/email) | `User[]` (без `passwordHash`) |
| POST | `/api/admin/users` | `{ email, name, role, password }` | `{ id }` 201 |
| GET | `/api/admin/users/[id]` | — | `User` (без `passwordHash`) |
| PUT | `/api/admin/users/[id]` | `{ name?, email?, password? }` | `{ ok: true }` |
| DELETE | `/api/admin/users/[id]` | — | `{ ok: true }` |

---

### 2.3 Назначения ревью

| Метод | Путь | Auth | Тело/Query | Описание |
|-------|------|------|-----------|----------|
| GET | `/api/admin/assignments` | Admin | `?articleId=` | Список назначений с именем ревьера |
| POST | `/api/admin/assignments` | Admin | `{ articleId, reviewerId }` | Создаёт снимок версии, назначение (status=pending), уведомление ревьеру |
| GET | `/api/admin/assignments/[id]` | Admin | — | Назначение + комментарии |
| PATCH | `/api/admin/assignments/[id]` | Admin | `{ status? }` | Принудительное закрытие ревью |
| DELETE | `/api/admin/assignments/[id]` | Admin | — | Удаление назначения |
| GET | `/api/reviewer/assignments` | Reviewer | — | Назначения для текущего ревьера |
| GET | `/api/reviewer/assignments/[id]` | Reviewer | — | Назначение + контент версии + комментарии |
| PATCH | `/api/reviewer/assignments/[id]` | Reviewer | `{ status: "accepted"\|"declined"\|"completed", reviewerNote? }` | Изменение статуса, создаёт уведомление admin |

Авторизация на reviewer-роутах: `session.userId === assignment.reviewerId`.

---

### 2.4 Комментарии ревью

| Метод | Путь | Auth | Тело | Описание |
|-------|------|------|------|----------|
| GET | `/api/assignments/[id]/review-comments` | Admin или назначенный ревьер | — | Тред комментариев |
| POST | `/api/assignments/[id]/review-comments` | Admin или назначенный ревьер | `{ content, quotedText?, quotedAnchor?, parentId? }` | Создаёт комментарий, уведомление при ответе |
| PUT | `/api/assignments/[id]/review-comments/[commentId]` | Автор или Admin | `{ content }` | Редактирование |
| DELETE | `/api/assignments/[id]/review-comments/[commentId]` | Автор или Admin | — | Удаление |

«Автор» = `session.userId === comment.authorId` ИЛИ `session.isAdmin === true`.

---

### 2.5 Публичные комментарии

| Метод | Путь | Auth | Тело/Query | Описание |
|-------|------|------|-----------|----------|
| GET | `/api/articles/[id]/comments` | Нет (публично) | `?versionId=` | Дерево комментариев; поле `isStale: boolean` если передан `versionId` |
| POST | `/api/articles/[id]/comments` | Reader | `{ content, parentId? }` | Создаёт комментарий; 400 если parentId уже имеет parentId (глубина > 2) |
| PUT | `/api/articles/[id]/comments/[commentId]` | Автор | `{ content }` | Редактирование (рекомендуется окно 15 мин) |
| DELETE | `/api/articles/[id]/comments/[commentId]` | Автор или Admin | — | Мягкое удаление (ставит `deletedAt`) |

`isStale`: `comment.articleVersionId !== currentPublishedVersionId` — вычисляется на сервере.

---

### 2.6 Changelog статьи

| Метод | Путь | Auth | Тело | Описание |
|-------|------|------|------|----------|
| GET | `/api/articles/[id]/changelog` | Нет (публично) | — | Записи по `entryDate DESC` |
| POST | `/api/articles/[id]/changelog` | Admin | `{ entryDate, section?, description }` | Создание записи |
| DELETE | `/api/articles/[id]/changelog/[entryId]` | Admin | — | Удаление записи |

---

### 2.7 Уведомления

| Метод | Путь | Auth | Query | Описание |
|-------|------|------|-------|----------|
| GET | `/api/notifications` | Admin или User | `?unread=1` | Уведомления для текущей сессии (по `isAdminRecipient` или `recipientId`) |
| PATCH | `/api/notifications/[id]/read` | Автор | — | Отметить одно как прочитанное |
| POST | `/api/notifications/read-all` | Автор | — | Отметить все как прочитанные |

---

### 2.8 Изменения существующих эндпоинтов

**`PUT /api/articles/[id]`** — новые поля в теле запроса:

```ts
{
  // существующие поля
  title?, slug?, content?, excerpt?, tags?, status?, changeNote?,

  // новые
  saveMode?: "draft" | "publish" | "send_for_review",
  reviewerId?: string,   // обязателен при saveMode = "send_for_review"
  changelog?: Array<{    // опционально при saveMode = "publish"
    entryDate: number,
    section?: string,
    description: string
  }>
}
```

При `saveMode === "send_for_review"`:
1. Сохранить снимок в `articleVersions` (существующее поведение).
2. Вставить запись в `reviewAssignments` (status=pending).
3. Вставить уведомление ревьеру (type=assignment_created).
4. Статус статьи (`articles.status`) не меняется.

При `saveMode === "publish"` с `changelog`:
1. Выполнить обычную публикацию.
2. Вставить записи в `articleChangelog`.

---

## 3. Страницы

### 3.1 Admin (под `/admin/(protected)/`)

| Путь | Описание |
|------|----------|
| `/admin` | Dashboard — существующий; добавить badge непрочитанных уведомлений |
| `/admin/articles` | Список статей — существующий; добавить кнопку «Отправить на ревью» |
| `/admin/articles/new` | Создание статьи — существующий |
| `/admin/articles/[id]` | Редактирование — существующий; + выбор `saveMode`, поиск ревьера, форма changelog |
| `/admin/articles/[id]/history` | История версий — существующий |
| `/admin/articles/[id]/review` | **Новый**: список назначений для статьи, тред ревью-комментариев |
| `/admin/users` | **Новый**: список ревьеров и читателей |
| `/admin/users/new` | **Новый**: форма создания пользователя |
| `/admin/users/[id]` | **Новый**: редактирование (имя, email, сброс пароля) |
| `/admin/notifications` | **Новый**: полный список уведомлений admin |

### 3.2 Reviewer (новый route group `/reviewer/(protected)/`)

Layout вызывает `requireUser("reviewer")`.

| Путь | Описание |
|------|----------|
| `/reviewer` | Dashboard: активные назначения, badge непрочитанных |
| `/reviewer/assignments` | Список всех назначений со статусами |
| `/reviewer/assignments/[id]` | Контент версии + тред ревью + кнопки «Принять» / «Отклонить» / «Завершить» |
| `/reviewer/notifications` | Полный список уведомлений |

Доступ к истории версий реализован внутри `/reviewer/assignments/[id]`
(таб или дополнительная страница — см. Фазу 8).

### 3.3 Публичные / Читательские страницы

| Путь | Описание |
|------|----------|
| `/login` | **Новый**: логин для readers и reviewers (email + пароль). Admin использует `/admin/login`. |
| `/account` | **Новый**: отображение имени и email (без самостоятельного редактирования в MVP) |
| `/blog/[slug]` | **Расширение**: три новых блока ниже контента (см. ниже) |

Новые секции на странице `/blog/[slug]`:
1. **Журнал изменений** — аккордеон, публично виден всем.
2. **Комментарии** — дерево комментариев; гости только читают, читатели могут писать.
3. **Баннер предупреждения** — «Вы просматриваете статью в версии, отличной от той,
   в которой был оставлен этот комментарий» (показывается выборочно над устаревшими комментариями).

---

## 4. Фазы реализации

Порядок определяется зависимостями. Каждая фаза завершается проверкой `npm run build`.

### Фаза 1: Foundation — БД + Auth

_Зависимости: нет._

1. Добавить 6 таблиц в `src/lib/db/schema.ts`.
2. `npx drizzle-kit generate` + `npx drizzle-kit migrate`.
3. Расширить `SessionData` в `src/lib/auth.ts`; добавить `requireUser(role?)`.
4. Реализовать `POST /api/auth/user` и `DELETE /api/auth/user`.
5. Создать страницу `/login` (форма email + пароль).

_Проверка:_ `npm run build` OK. Существующий admin-флоу не нарушен.

---

### Фаза 2: Управление пользователями

_Зависимости: Фаза 1._

1. API: `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/[id]`.
2. Страницы: `/admin/users`, `/admin/users/new`, `/admin/users/[id]`.
3. Seed-скрипт: добавить пример ревьера и читателя.

_Проверка:_ Admin создаёт, редактирует, удаляет пользователей.

---

### Фаза 3: Workflow ревью

_Зависимости: Фаза 2._

1. Расширить `PUT /api/articles/[id]` для `saveMode: "send_for_review"`.
2. API: `GET/POST/PATCH/DELETE /api/admin/assignments[/id]`.
3. API: `GET/PATCH /api/reviewer/assignments[/id]`.
4. Admin: обновить `/admin/articles/[id]` — кнопка «Отправить на ревью», поиск ревьера.
5. Admin: создать `/admin/articles/[id]/review`.
6. Reviewer: route group layout + `/reviewer` dashboard.
7. Reviewer: `/reviewer/assignments` и `/reviewer/assignments/[id]`.

_Проверка:_ Полный флоу: admin отправляет → ревьер принимает → видит контент версии.

---

### Фаза 4: Комментарии ревью

_Зависимости: Фаза 3._

1. API: `GET/POST/PUT/DELETE /api/assignments/[id]/review-comments[/commentId]`.
2. UI в `/reviewer/assignments/[id]`: текстовое поле, выделение текста → цитата, ответы.
3. UI в `/admin/articles/[id]/review`: admin читает и отвечает ревьеру.
4. Уведомления при ответе (`review_comment_reply`).

_Проверка:_ Ревьер пишет комментарий с цитатой → admin отвечает → ревьер видит ответ.

---

### Фаза 5: Уведомления

_Зависимости: Фазы 3 и 4 (уведомления создаются в обеих)._

1. API: `GET /api/notifications`, `PATCH /api/notifications/[id]/read`, `POST /api/notifications/read-all`.
2. Polling-компонент (client, `setInterval` 30s) — в admin layout и reviewer layout.
3. Badge с количеством непрочитанных в навигации.
4. Страницы `/admin/notifications` и `/reviewer/notifications`.

_Проверка:_ Ревьер принимает назначение → у admin инкрементируется badge.

---

### Фаза 6: Публичные комментарии

_Зависимости: Фаза 1 (users), Фаза 2 (аккаунты читателей)._

_Может выполняться параллельно с Фазой 5._

1. API: `GET/POST/PUT/DELETE /api/articles/[id]/comments[/commentId]`.
2. Секция комментариев на `/blog/[slug]`: дерево для гостей, форма для читателей.
3. Stale-detection: сравнение `comment.articleVersionId` с текущей опубликованной версией.
4. Отображение мягко-удалённых: «[удалено]» с сохранением структуры треда.
5. Уведомления при ответе (`public_comment_reply`).

_Проверка:_ Читатель комментирует статью → другой отвечает → предупреждение появляется после переиздания.

---

### Фаза 7: Changelog статьи

_Зависимости: Фаза 1 (таблица создана). Может идти параллельно с Фазой 6._

1. API: `GET/POST/DELETE /api/articles/[id]/changelog[/entryId]`.
2. Форма записей changelog в `/admin/articles/[id]` — дата, раздел (опц.), описание.
3. Передача `changelog[]` в `PUT /api/articles/[id]` при `saveMode: "publish"`.
4. Аккордеон «Журнал изменений» на `/blog/[slug]`.

_Проверка:_ Admin публикует с записью changelog → запись видна на публичной странице.

---

### Фаза 8: Доступ ревьера к истории версий

_Зависимости: Фаза 3._

1. API: `GET /api/reviewer/assignments/[id]/versions` — версии в рамках назначенной задачи.
2. UI в `/reviewer/assignments/[id]`: вкладка или отдельная страница для просмотра версий.

_Проверка:_ Ревьер видит историю до и включая назначенную версию.

---

### Фаза 9: Hardening

_Зависимости: все предыдущие фазы._

1. Rate limiting на `/api/auth/user` (пакет `@upstash/ratelimit` или in-memory Map).
2. Пагинация для `GET /api/articles/[id]/comments` и `GET /api/notifications`.
3. Pruning уведомлений: удалять `is_read = 1 AND created_at < (now - 30 дней)` при каждом GET.
4. Аудит всех новых эндпоинтов: валидация входных данных, коды ошибок.

---

## 5. Риски и открытые вопросы

### Риск 1: `RESTRICT` на версии с публичными комментариями

`onDelete: "restrict"` на `publicComments.articleVersionId` — нельзя удалить версию, к которой
привязаны комментарии. Admin UI должен чётко объяснять это ограничение.

**Рекомендация:** Не разрешать удаление версий с комментариями; объяснять в UI.

---

### Риск 2: Race condition при двойном нажатии «Отправить на ревью»

Может создаться два назначения для одной пары `(articleId, reviewerId)`.

**Рекомендация:** Guard в `POST /api/admin/assignments` — проверять наличие `pending` или
`accepted` назначения для той же пары и возвращать 409.

---

### Риск 3: Нагрузка polling-запросов на Turso

30-секундный опрос уведомлений при большом числе пользователей.

**Рекомендация:** Индексы в схеме с первого дня:
```ts
index("notifications_recipient_read_idx")
  .on(notifications.recipientId, notifications.isRead)
```

---

### Риск 4: `quotedAnchor` становится невалидным при редактировании

Символьные офсеты привязаны к тексту конкретной версии. Если ревьер открывает
более новую версию, офсеты могут указывать на другой текст.

**Рекомендация:** Хранить `quotedText` как основной якорь (поиск по тексту), `quotedAnchor`
использовать только как подсказку для scroll-to. MDX-рендер добавляет `data-paragraph-index`
к блочным элементам; якорь остаётся корректным внутри назначенной версии.

---

### Риск 5: Инвариант сессии (isAdmin + userId)

`SessionData` может теоретически содержать оба поля одновременно.

**Рекомендация:** `POST /api/auth/user` проверяет `session.isAdmin !== true` перед установкой
`userId`. Admin login проверяет `session.userId` не задан. Добавить utility `clearOtherRoleState(session)`.

---

### Открытый вопрос 1: Сброс пароля

Email-системы нет — сброс пароля инициирует только admin через
`PUT /api/admin/users/[id]`. Документировать это явно в UI.

---

### Открытый вопрос 2: Окно редактирования публичного комментария

Редактировать бессрочно или только 15 минут?

**Рекомендация:** 15 минут: `Math.floor(Date.now()/1000) - comment.createdAt < 900` в PUT-обработчике.

---

### Открытый вопрос 3: Видимость ревью-комментариев между ревьерами

Если две назначения на одну статью — видят ли ревьеры комментарии друг друга?

**Рекомендация:** Нет. Каждый ревьер видит только комментарии своего `assignmentId`.
При необходимости расширяется изменением scope запроса без изменения схемы.

---

### Открытый вопрос 4: Retention уведомлений

Уведомления накапливаются бесконечно.

**Рекомендация** (Фаза 9): При каждом GET удалять прочитанные уведомления старше 30 дней.

---

## Критические файлы для реализации

| Файл | Что меняется |
|------|-------------|
| `src/lib/db/schema.ts` | Добавить 6 новых таблиц как экспорты |
| `src/lib/auth.ts` | Расширить `SessionData`, добавить `requireUser()` |
| `src/app/api/articles/[id]/route.ts` | Расширить PUT-обработчик: `saveMode`, `changelog`, review-assignment |
| `src/app/admin/(protected)/layout.tsx` | Добавить polling badge уведомлений |
| `drizzle.config.ts` | Не меняется; dialect остаётся `"turso"` |
