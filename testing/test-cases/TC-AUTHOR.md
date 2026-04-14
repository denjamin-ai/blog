# Test Cases: АВТОР (role: author)

**Покрытие:** US-A1..A20  
**Тестовый аккаунт:** никнейм `author`, пароль `password` (роль `author`)

---

## TC-A-001: Вход автора — успешный

**US:** US-A1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть `/login`, ввести `author` / `password`, нажать «Войти»
   **Expected:** Редирект на `/author`

---

## TC-A-002: Дашборд автора

**US:** US-A2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как `author`

### Test Steps
1. Открыть `/author`
   **Expected:** Три карточки: «Всего», «Опубликовано», «Черновики» с корректными числами; кнопки «Написать статью», «Все мои статьи»

---

## TC-A-003: Создание черновика — успешно

**US:** US-A3  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Авторизован как `author`

### Test Steps
1. Нажать «Новая статья» → открывается `/author/articles/new`

2. Заполнить: Заголовок `«Тестовая статья»`, Описание, Теги `["test"]`, MDX-контент
   **Expected:** Слаг генерируется автоматически из заголовка

3. Нажать «Сохранить черновик»
   **Expected:** Статья создана со статусом `draft`; редирект на `/author/articles/[id]`

### Test Data
| Поле | Значение |
|------|---------|
| Заголовок | `Тестовая статья` |
| Слаг | `testovaia-statia` (авто) |
| Статус | `draft` |

### Post-conditions
- Статья появляется в счётчике «Черновики» на дашборде

---

## TC-A-004: Создание черновика — занятый слаг

**US:** US-A3  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья с тем же slug уже существует

### Test Steps
1. Создать статью с тем же заголовком/slug
   **Expected:** Ошибка «Слаг занят»; статья не создаётся

---

## TC-A-005: Создание черновика — пустой заголовок

**US:** US-A3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Попытаться сохранить статью с пустым заголовком
   **Expected:** Клиентская валидация; форма не отправляется

---

## TC-A-006: Публикация статьи

**US:** US-A4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть черновик, принадлежащий этому автору

### Test Steps
1. Открыть `/author/articles/[id]`, нажать «Опубликовать»
   **Expected:** Статус → `published`; `publishedAt` проставлен; кнопка меняется на «Снять с публикации»

2. Открыть `/blog` (без авторизации)
   **Expected:** Статья появилась в публичном списке

---

## TC-A-007: Публикация — автор заблокирован

**US:** US-A4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Автор имеет `isBlocked=1`

### Test Steps
1. Попытка `PUT /api/articles/[id]` с `{ saveMode: "publish" }`
   **Expected:** HTTP 403

---

## TC-A-008: Снятие с публикации

**US:** US-A5  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья в статусе `published`

### Test Steps
1. Нажать «Снять с публикации» на `/author/articles/[id]`
   **Expected:** Статус → `draft`; статья исчезает с `/blog`

---

## TC-A-009: Редактирование статьи — успешно

**US:** US-A6  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. Открыть `/author/articles/[id]`, изменить заголовок, добавить change note «Исправлена опечатка»
2. Нажать «Сохранить»
   **Expected:** Версия старого содержимого сохранена в `articleVersions`; статья обновлена

3. Перейти на `/author/articles/[id]/history`
   **Expected:** Новая запись с change note «Исправлена опечатка»

---

## TC-A-010: Редактирование — слаг занят другой статьёй

**US:** US-A6  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Попытаться изменить slug на значение, уже используемое другой статьёй
   **Expected:** Ошибка «Слаг занят»; статья не обновлена

---

## TC-A-011: Редактирование чужой статьи — запрет

**US:** US-A6  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `PUT /api/articles/[чужой_id]` с телом обновления
   **Expected:** HTTP 403

---

## TC-A-012: Отправка статьи на ревью

**US:** US-A7  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Есть пользователь с ролью `reviewer`

### Test Steps
1. На странице редактирования → «На ревью» → открывается `ReviewerPickerModal`

2. Ввести ≥ 2 символа никнейма ревьюера
   **Expected:** Список ревьюеров в модале

3. Выбрать ревьюера, подтвердить
   **Expected:** Создан `reviewAssignment` (pending); на странице появился блок активного ревью

---

## TC-A-013: Отправка на ревью — дублирование (409)

**US:** US-A7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Уже есть активное назначение для этого ревьюера

### Test Steps
1. Попытаться назначить того же ревьюера повторно
   **Expected:** HTTP 409; дублирующее назначение не создаётся

---

## TC-A-014: Уведомление ревьюера об изменениях

**US:** US-A8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть активное назначение

### Test Steps
1. На `/author/articles/[id]` → «Уведомить ревьюера»
   **Expected:** Ревьюер получает уведомление `article_updated`; кнопка доступна

2. Проверить при отсутствии активного назначения
   **Expected:** Кнопка отсутствует

---

## TC-A-015: История версий статьи

**US:** US-A9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Перейти на `/author/articles/[id]/history`
   **Expected:** Хронологический список версий; дата, заметка, MDX-превью

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет версий | Пустой список |

---

## TC-A-016: Статус ревью — просмотр

**US:** US-A10  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Перейти на `/author/articles/[id]/review`
   **Expected:** Список назначений: ревьюер, цветной бейдж статуса, дата, заметка ревьюера

---

## TC-A-017: Удаление статьи — успешно

**US:** US-A11  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. На `/author/articles/[id]` → «Удалить» → подтвердить
   **Expected:** Статья удалена; редирект на `/author/articles`; версии, назначения, комментарии удалены каскадно

---

## TC-A-018: Удаление чужой статьи — запрет

**US:** US-A11  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `DELETE /api/articles/[чужой_id]`
   **Expected:** HTTP 403

---

## TC-A-019: Уведомления автора

**US:** US-A12  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть непрочитанные уведомления (`assignment_accepted`, `review_completed` и т.д.)

### Test Steps
1. Открыть `/author/notifications`
   **Expected:** Непрочитанные выделены (акцентный фон); прочитанные без акцента; типы уведомлений соответствуют JTBD

2. Кликнуть на уведомление
   **Expected:** Переход к ресурсу; уведомление помечено прочитанным

3. «Отметить все прочитанными»
   **Expected:** Все уведомления — прочитанные; `NotificationBadge` обнуляется

---

## TC-A-020: Выход автора

**US:** US-A14  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Нажать «Выйти» в навигации `/author/`
   **Expected:** Сессия очищена; редирект на `/login`

---

## TC-A-021: Редактирование публичного профиля — успешно

**US:** US-A15  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 6 мин

### Test Steps
1. Перейти на `/author/profile`
   **Expected:** Форма с полями: отображаемое имя, bio, slug, ссылки

2. Заполнить все поля, нажать «Сохранить»
   **Expected:** Профиль обновлён; кнопка «Смотреть публичный профиль» → `/authors/[slug]`

3. Открыть `/authors/[slug]` без авторизации
   **Expected:** Обновлённые данные отображаются

---

## TC-A-022: Профиль автора — занятый slug

**US:** US-A15  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Попытаться сохранить slug, уже используемый другим автором
   **Expected:** Ошибка «Slug занят»

---

## TC-A-023: Профиль автора — неверный формат slug

**US:** US-A15  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Ввести slug с недопустимыми символами: `My Profile!` или `UPPER`
   **Expected:** Валидация; ошибка «Slug должен содержать только a-z, 0-9, дефис»

---

## TC-A-024: Загрузка обложки статьи — успешно

**US:** US-A16  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. В форме редактирования статьи → поле «Обложка» → выбрать JPG/PNG (≤ 2 МБ)
   **Expected:** `POST /api/upload` → HTTP 200; возвращается `{ url: "/uploads/..." }`; превью отображается

---

## TC-A-025: Загрузка обложки — превышение размера

**US:** US-A16  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Попытаться загрузить файл > 2 МБ
   **Expected:** HTTP 413; ошибка до буферизации (по Content-Length)

---

## TC-A-026: Загрузка обложки — неверный тип файла

**US:** US-A16  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Загрузить `.gif` или `.pdf`
   **Expected:** HTTP 415; ошибка «Неподдерживаемый тип файла»; проверка по magic bytes, не по расширению

---

## TC-A-027: Планирование публикации — успешно

**US:** US-A17  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. На `/author/articles/[id]` → «Запланировать» → ввести дату в будущем → подтвердить
   **Expected:** Статус → `scheduled`; `scheduledAt` сохранён; в UI виден «Запланировано на [дату]»

---

## TC-A-028: Планирование — дата в прошлом

**US:** US-A17  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Попытаться запланировать на дату в прошлом
   **Expected:** Валидация; ошибка «Дата должна быть в будущем»

---

## TC-A-029: Предпросмотр статьи

**US:** US-A18  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. На `/author/articles/[id]` → «Предпросмотр»
   **Expected:** Открывается `/author/articles/[id]/preview`; MDX-контент рендерится как на публичной странице; статус не изменился

---

## TC-A-030: Предпросмотр чужой статьи — запрет

**US:** US-A18  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/author/articles/[чужой_id]/preview`
   **Expected:** HTTP 403 или редирект

---

## TC-A-031: Diff изменений статьи

**US:** US-A19  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть активное ревью-назначение; статья была изменена после назначения

### Test Steps
1. На `/author/articles/[id]/review` → «Diff»
   **Expected:** `GET /api/author/assignments/[id]/diff` → визуальное сравнение; `hasChanges: true`

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Статья не изменялась | `hasChanges: false`; сообщение «Изменений нет» |

---

## TC-A-032: Резолв комментария ревью

**US:** US-A20  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть активное назначение (`pending`/`accepted`); ревьюер оставил комментарий

### Test Steps
1. На `/author/articles/[id]/review` → «Решить» рядом с комментарием
   **Expected:** `PUT /api/review-comments/[id]/resolve` `{ resolved: true }`; комментарий помечен как решённый (`resolvedAt` установлен)

---

## TC-A-033: Резолв при завершённом ревью — запрет

**US:** US-A20  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Назначение в статусе `completed` или `declined`

### Test Steps
1. `PUT /api/review-comments/[id]/resolve` `{ resolved: true }`
   **Expected:** HTTP 403 или 422; действие заблокировано

---

## TC-A-034: Доступ к чужой статье в admin-разделе — запрет

**US:** US-A6 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. Авторизоваться как `author`; попытаться открыть `/admin/articles`
   **Expected:** HTTP 403 или редирект на `/login`
