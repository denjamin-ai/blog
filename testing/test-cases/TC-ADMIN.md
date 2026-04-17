# Test Cases: АДМИНИСТРАТОР (env-based)

**Покрытие:** US-AD1..AD29  
**Аутентификация:** пароль из `ADMIN_PASSWORD_HASH` в `.env.local`

---

## TC-AD-001: Вход администратора — успешный

**US:** US-AD1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть `/admin/login`, ввести корректный пароль
   **Expected:** Редирект на `/admin`; сессия `isAdmin=true`

---

## TC-AD-002: Вход администратора — неверный пароль

**US:** US-AD1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Ввести неверный пароль
   **Expected:** Сообщение об ошибке; сессия не установлена

---

## TC-AD-003: Rate-limit на логин

**US:** US-AD1  
**Priority:** P1  
**Type:** Security  
**Estimated Time:** 3 мин

### Test Steps
1. Выполнить 5+ неудачных попыток входа подряд
   **Expected:** Rate-limit активируется; ошибка «Слишком много попыток»; HTTP 429

---

## TC-AD-004: Дашборд администратора

**US:** US-AD2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как администратор

### Test Steps
1. Открыть `/admin`
   **Expected:** 3 карточки: «Всего статей», «Опубликовано», «Черновики»; кнопка «Новая статья»

---

## TC-AD-005: Список всех статей

**US:** US-AD3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть `/admin/articles`
   **Expected:** Таблица: заголовок, автор («Администратор» если `authorId=null`), статус, дата; кнопки «Редактировать», «История», «Скрыть» (для published)

---

## TC-AD-006: Создание статьи — черновик

**US:** US-AD4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. «Новая статья» → `/admin/articles/new` → заполнить поля → «Сохранить черновик»
   **Expected:** Статья создана (`draft`, `authorId=null`); редирект на `/admin/articles/[id]`

---

## TC-AD-007: Создание статьи — публикация

**US:** US-AD4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. Заполнить форму → «Опубликовать»
   **Expected:** Статья создана (`published`, `publishedAt` установлен); видна на `/blog`

---

## TC-AD-008: Создание статьи — занятый slug

**US:** US-AD4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Попытаться создать статью с занятым slug
   **Expected:** Ошибка «Слаг занят»; статья не создаётся

---

## TC-AD-009: Редактирование статьи — успешно

**US:** US-AD5  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. «Редактировать» → `/admin/articles/[id]` → изменить поля → ввести change note → «Сохранить»
   **Expected:** Версия до изменения сохранена в `articleVersions`; статья обновлена

2. Перейти на `/admin/articles/[id]/history`
   **Expected:** Новая версия в списке с change note

---

## TC-AD-010: Публикация статьи

**US:** US-AD6  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. На `/admin/articles/[id]` → «Опубликовать»
   **Expected:** Статус → `published`; статья появляется на `/blog`

---

## TC-AD-011: Скрытие статьи из таблицы

**US:** US-AD6  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. В `/admin/articles` → кнопка «Скрыть» рядом с опубликованной статьёй
   **Expected:** Статус → `draft`; статья исчезает с `/blog`

---

## TC-AD-012: Отправка статьи на ревью

**US:** US-AD7  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. На `/admin/articles/[id]` → «На ревью» → `ReviewerPickerModal` → выбрать ревьюера → подтвердить
   **Expected:** Создано `reviewAssignment` (pending) + snapshot версии; ревьюер получает `assignment_created`

---

## TC-AD-013: Дублирование назначения ревью (409)

**US:** US-AD7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Уже есть активное назначение для этого ревьюера

### Test Steps
1. Попытаться назначить того же ревьюера повторно
   **Expected:** HTTP 409; новое назначение не создаётся

---

## TC-AD-014: Уведомление ревьюера об обновлении

**US:** US-AD8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. На `/admin/articles/[id]` (есть активное назначение) → «Уведомить ревьюера»
   **Expected:** Ревьюер получает `article_updated`; кнопка доступна только при активном назначении

---

## TC-AD-015: Просмотр ревью-назначений статьи

**US:** US-AD9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. Перейти на `/admin/articles/[id]/review`
   **Expected:** Список назначений; каждое раскрывается с тредом комментариев (admin + reviewer)

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет назначений | Пустой список |

---

## TC-AD-016: Комментарий администратора в треде ревью

**US:** US-AD10  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. На `/admin/articles/[id]/review` → в треде назначения → ввести текст → отправить
   **Expected:** Комментарий с `isAdminComment=1` появляется; ревьюер получает `review_comment_reply`

---

## TC-AD-017: История версий статьи

**US:** US-AD11  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Перейти на `/admin/articles/[id]/history`
   **Expected:** Список версий с датой, заметкой, MDX-превью

---

## TC-AD-018: Добавление changelog-записи

**US:** US-AD12  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. На `/admin/articles/[id]` → секция «Changelog» → «Добавить запись» → ввести дату, секцию, описание → «Опубликовать»
   **Expected:** Запись сохранена; отображается в `ArticleChangelog` на публичной странице

---

## TC-AD-019: Удаление changelog-записи

**US:** US-AD12  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Нажать «Удалить» на существующей записи changelog
   **Expected:** Запись немедленно удаляется; `DELETE /api/articles/[id]/changelog/[entryId]` → HTTP 200

2. `DELETE /api/articles/[id]/changelog/[несуществующий_id]`
   **Expected:** HTTP 404

---

## TC-AD-020: Управление публичными комментариями

**US:** US-AD13  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. На `/admin/articles/[id]` → секция «Комментарии» → «Удалить» на любом комментарии
   **Expected:** Мягкое удаление (`deletedAt` установлен); комментарий показывается как «[удалено]»

---

## TC-AD-021: RESTRICT — удаление версии с комментариями

**US:** US-AD13 (critical edge case)  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Есть `articleVersion`, к которой привязан публичный комментарий (`publicComments.articleVersionId`)

### Test Steps
1. Попытаться удалить эту версию напрямую через API
   **Expected:** HTTP 409 или 500 (RESTRICT); версия не удалена; UI должен предупреждать об этом

---

## TC-AD-022: Удаление статьи — каскадное

**US:** US-AD14  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. На `/admin/articles/[id]` → «Удалить» → подтвердить
   **Expected:** Статья удалена; редирект на `/admin/articles`; связанные версии, назначения, комментарии удалены

---

## TC-AD-023: Список пользователей

**US:** US-AD15  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Перейти на `/admin/users`
   **Expected:** Таблица: имя, никнейм, роль (цветной бейдж), дата создания; кнопки «Редактировать», «Удалить»; кнопка «Создать пользователя»

---

## TC-AD-024: Создание пользователя — успешно

**US:** US-AD16  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. «Создать пользователя» → `/admin/users/new` → заполнить: никнейм `newreader`, имя, роль «Читатель», пароль `pass123` → «Создать»
   **Expected:** Пользователь создан; редирект на `/admin/users`

### Test Data
| Поле | Значение |
|------|---------|
| Никнейм | `newreader` |
| Роль | `reader` |
| Пароль | `pass123` |

### Post-conditions
- Удалить тестового пользователя после проверки

---

## TC-AD-025: Создание пользователя — занятый никнейм

**US:** US-AD16  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Попытаться создать пользователя с уже существующим никнеймом
   **Expected:** Ошибка «Никнейм занят»

---

## TC-AD-026: Создание пользователя — пароль < 6 символов

**US:** US-AD16  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Ввести пароль `abc` (3 символа)
   **Expected:** Клиентская или серверная валидация; ошибка «Пароль должен быть не менее 6 символов»

---

## TC-AD-027: Редактирование данных пользователя

**US:** US-AD17  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. «Редактировать» → `/admin/users/[id]` → изменить имя, роль → «Сохранить»
   **Expected:** Данные обновлены; без пароля — пароль не меняется

2. Заполнить новый пароль → «Сохранить»
   **Expected:** Старый пароль больше не работает; новый работает

---

## TC-AD-028: Блокировка автора — cascade unpublish

**US:** US-AD18  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Автор с опубликованными статьями

### Test Steps
1. `/admin/users/[id]` (роль: author) → включить «Скрыть публикации автора» → «Сохранить»
   **Expected:** Все опубликованные статьи автора переходят в `draft`; статьи исчезают с `/blog`; автор получает уведомление `article_hidden`

2. Снять блокировку (`isBlocked=0`) → «Сохранить»
   **Expected:** `isBlocked` снят; статьи остаются в `draft` (не публикуются автоматически)

---

## TC-AD-029: Запрет комментирования читателю

**US:** US-AD19  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. `/admin/users/[id]` (роль: reader) → включить «Запретить оставлять комментарии» → «Сохранить»
   **Expected:** `commentingBlocked=1` установлен

2. Войти как этот читатель → попытаться оставить комментарий
   **Expected:** HTTP 403

3. Попытаться проголосовать за статью/комментарий
   **Expected:** HTTP 403

---

## TC-AD-030: Удаление пользователя — cascade set null

**US:** US-AD20  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Автор с опубликованными статьями

### Test Steps
1. «Удалить» пользователя → подтвердить
   **Expected:** Пользователь удалён; его статьи сохранились с `authorId=null` (отображаются как «Администратор»)

---

## TC-AD-031: Уведомления администратора

**US:** US-AD21  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. Открыть `/admin/notifications`
   **Expected:** Непрочитанные (акцентный фон) + прочитанные; типы: `assignment_accepted`, `assignment_declined`, `review_completed`, `review_comment_reply`

2. Кликнуть на уведомление
   **Expected:** Уведомление помечено прочитанным; переход к ресурсу

3. «Отметить все прочитанными»
   **Expected:** Все — прочитанные; `NotificationBadge` обнуляется

---

## TC-AD-032: Выход администратора

**US:** US-AD23  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. «Выйти» в навигации
   **Expected:** Сессия очищена; редирект на `/admin/login`

---

## TC-AD-033: Настройки блога — сохранение профиля

**US:** US-AD24  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. Перейти на `/admin/settings` → заполнить название, bio, загрузить аватар, добавить ссылки → «Сохранить»
   **Expected:** `PUT /api/admin/settings/profile` → HTTP 200; данные сохранены

2. Открыть главную страницу `/`
   **Expected:** Обновлённые данные профиля отображаются

---

## TC-AD-034: Шаблон чеклиста ревью

**US:** US-AD25  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. В `/admin/settings` → «Шаблон чеклиста» → добавить 3 пункта → «Сохранить»
   **Expected:** `PUT /api/admin/settings/checklist` → HTTP 200; шаблон сохранён

2. Назначить новое ревью для любой статьи
   **Expected:** `reviewChecklists` для этого назначения создан с пунктами из шаблона

3. Изменить шаблон
   **Expected:** Существующий чеклист не изменился (изоляция)

---

## TC-AD-035: Upload изображения — успешно

**US:** US-AD26  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. `POST /api/upload` с JPG-файлом ≤ 2 МБ
   **Expected:** HTTP 200; `{ url: "/uploads/[ulid].jpg" }`; файл существует в `public/uploads/`

---

## TC-AD-036: Upload — файл > 2 МБ

**US:** US-AD26  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. `POST /api/upload` с файлом 3 МБ и `Content-Length: 3145728`
   **Expected:** HTTP 413; файл не сохранён; ошибка до буферизации (по Content-Length)

---

## TC-AD-037: Upload — неверный тип (magic bytes)

**US:** US-AD26  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 3 мин

### Test Steps
1. Загрузить `.exe` файл с Content-Type `image/jpeg`
   **Expected:** HTTP 415; файл не сохранён; ошибка «Неподдерживаемый тип файла»

2. Загрузить `.gif` (валидный GIF, не JPG/PNG/WebP)
   **Expected:** HTTP 415

---

## TC-AD-038: Upload — не авторизован

**US:** US-AD26  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `POST /api/upload` без сессии или с сессией `reader`
   **Expected:** HTTP 401 или 403

---

## TC-AD-039: Планирование публикации статьи

**US:** US-AD27  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. На `/admin/articles/[id]` → «Запланировать» → ввести дату в будущем → подтвердить
   **Expected:** Статус → `scheduled`; `scheduledAt` сохранён; статья не видна на `/blog`

2. Проверить `GET /api/cron/publish` (имитировать срабатывание cron)
   **Expected:** Если `scheduledAt ≤ now()`, статья публикуется; подписчики получают уведомление

---

## TC-AD-040: Планирование — дата в прошлом

**US:** US-AD27  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. `PUT /api/articles/[id]` с `{ saveMode: "schedule", scheduledAt: <прошлое_время> }`
   **Expected:** HTTP 422; статья не переходит в `scheduled`

---

## TC-AD-041: Планирование — автор заблокирован (cron skip)

**US:** US-AD27  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья запланирована; автор заблокирован (`isBlocked=1`)

### Test Steps
1. Вызвать `GET /api/cron/publish` (Bearer-токен)
   **Expected:** Статья пропущена (`skipped++`); статус остаётся `scheduled`

---

## TC-AD-042: Предпросмотр статьи (Admin)

**US:** US-AD28  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. На `/admin/articles/[id]` → «Предпросмотр»
   **Expected:** Открывается `/admin/articles/[id]/preview`; MDX рендерится; статус не изменился

---

## TC-AD-043: Diff изменений (Admin)

**US:** US-AD29  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья изменена после создания ревью-назначения

### Test Steps
1. На `/admin/articles/[id]/review` → «Diff»
   **Expected:** `GET /api/admin/assignments/[id]/diff` → `{ hasChanges: true }`; визуальное сравнение

---

## TC-AD-044: Cron — неверный токен

**US:** US-AD27 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `GET /api/cron/publish` без заголовка `Authorization` или с неверным токеном
   **Expected:** HTTP 401; статьи не публикуются

---

## TC-AD-045: Изоляция — admin не может использовать user-роли API

**US:** US-AD1 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 3 мин

### Test Steps
1. Авторизоваться как admin, вызвать `GET /api/author/assignments`
   **Expected:** HTTP 401 или 403 (требуется `userId`, а не `isAdmin`)

2. `GET /api/reviewer/assignments`
   **Expected:** HTTP 403

---

## Мультиревьюер и сессии ревью

## TC-AD-SESSION-001: Создание сессии с 3 ревьюерами

**US:** US-AD9  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 8 мин

### Preconditions
- [ ] Есть ≥ 3 пользователя с ролью `reviewer`; статья в статусе `draft`

### Test Steps
1. Открыть `/admin/articles/[id]` → «Отправить на ревью» → выбрать ревьюера #1 через `ReviewerPickerModal`
   **Expected:** Назначение #1 создано (pending); уведомление ревьюеру #1
2. Повторить для ревьюера #2 и ревьюера #3
   **Expected:** Три отдельных назначения; три уведомления
3. Проверить страницу `/admin/articles/[id]/review`
   **Expected:** Три карточки назначений: имя ревьюера, статус `pending`, дата создания

---

## TC-AD-SESSION-002: Просмотр статуса сессии (3 карточки)

**US:** US-AD9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья с тремя назначениями в разных статусах (pending, accepted, completed)

### Test Steps
1. Открыть `/admin/articles/[id]/review`
   **Expected:** Три карточки с разными цветными бейджами статусов; у завершённого — вердикт и заметка ревьюера

---

## TC-AD-SESSION-003: Уведомить всех ревьюеров сессии

**US:** US-AD9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть ≥ 2 активных назначения (pending или accepted)

### Test Steps
1. На `/admin/articles/[id]` сохранить изменения с `saveMode=notify_reviewer`
   **Expected:** Уведомления `article_updated` отправлены всем ревьюерам с активными назначениями

---

## TC-AD-GUIDE-001: Открытие руководства администратора

**US:** US-AD2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. На `/admin` найти ссылку/кнопку «Руководство»
   **Expected:** Модальное окно или страница с руководством для администратора открывается; контент содержит инструкции по управлению блогом

---

## Inline Annotations (Фаза 30)

**Покрытие:** US-AD32..AD34

---

## TC-AD-ANNO-001: Все аннотации видны включая batch-pending

**US:** US-AD32  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер создал pending_batch комментарии (ещё не отправил ревью)

### Test Steps
1. Войти как admin → открыть `/admin/articles/[id]/review` → выбрать назначение
   **Expected:** Split-view с подсветками аннотаций; видны ВСЕ аннотации, включая batch-pending

2. Проверить batch-pending комментарии
   **Expected:** Batch-pending помечены визуально (например, пунктирная подсветка или бейдж «Черновик ревью»)

---

## TC-AD-ANNO-002: Batch-pending видны админу, не видны другим ревьюерам

**US:** US-AD32  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер 1 создал pending_batch комментарии
- [ ] Ревьюер 2 назначен на ту же сессию

### Test Steps
1. `GET /api/sessions/[id]/review-comments` от лица admin
   **Expected:** Ответ содержит pending_batch комментарии ревьюера 1

2. `GET /api/sessions/[id]/review-comments` от лица ревьюера 2
   **Expected:** Ответ НЕ содержит pending_batch комментарии ревьюера 1

3. `GET /api/sessions/[id]/review-comments` от лица автора статьи
   **Expected:** Ответ НЕ содержит pending_batch комментарии

---

## TC-AD-ANNO-003: Ответ от лица администратора с бейджем

**US:** US-AD33  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Ревьюер создал inline-аннотацию (visible)

### Test Steps
1. В правой панели найти тред → ввести ответ → «Ответить»
   **Expected:** Ответ появляется с `isAdminComment=1`; визуально помечен бейджем «Админ»

2. Проверить уведомление у ревьюера
   **Expected:** Ревьюер получил `review_comment_reply`

---

## TC-AD-ANNO-004: Применить suggestion на любой статье

**US:** US-AD34  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер создал suggestion на статью другого автора

### Test Steps
1. Открыть `/admin/articles/[id]/review` → найти suggestion-тред → «Применить правку»
   **Expected:** MDX-источник обновлён; версия создана в `articleVersions`; тред resolved

2. Проверить статью
   **Expected:** Предложенный текст заменил оригинал; бейдж «Правка применена»

---

## TC-AD-ANNO-005: Apply → MDX обновлён + notification suggestion_applied

**US:** US-AD34  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Админ применил suggestion (TC-AD-ANNO-004)

### Test Steps
1. Войти как ревьюер → проверить уведомления
   **Expected:** Уведомление `suggestion_applied` с ссылкой на статью

2. Войти как автор статьи → проверить уведомления
   **Expected:** Уведомление об изменении статьи (версия создана)
