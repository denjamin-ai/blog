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

---

## Мультиревьюер и сессии ревью

## TC-A-SESSION-001: Отправка статьи difficulty=hard на 2 ревьюеров

**US:** US-A7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 6 мин

### Preconditions
- [ ] Статья с `difficulty=hard`; есть ≥ 2 пользователя с ролью `reviewer`

### Test Steps
1. На странице редактирования → «На ревью» → открывается `ReviewerPickerModal`
2. Найти и выбрать первого ревьюера → подтвердить
   **Expected:** `reviewAssignment #1` создан (status=pending); уведомление ревьюеру #1
3. Повторить: «На ревью» → выбрать второго ревьюера → подтвердить
   **Expected:** `reviewAssignment #2` создан (status=pending); уведомление ревьюеру #2
4. Проверить страницу `/author/articles/[id]/review`
   **Expected:** Два блока активных назначений с именами обоих ревьюеров

---

## TC-A-SESSION-002: Попытка отправить difficulty=hard с 1 ревьюером — UI-блокировка

**US:** US-A7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья с `difficulty=hard`; уже есть одно активное назначение

### Test Steps
1. На странице редактирования → «На ревью» → открывается `ReviewerPickerModal`
   **Expected:** Если для `difficulty=hard` требуется ≥ 2 ревьюера и уже один назначен, UI предупреждает или блокирует отправку
2. Попытаться отправить без второго ревьюера
   **Expected:** Кнопка подтверждения заблокирована или показывается предупреждение

---

## TC-A-SESSION-003: Попытка создать вторую сессию при активной → 409

**US:** US-A7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Уже есть активное назначение (status=pending или accepted) для этого ревьюера

### Test Steps
1. Попытаться назначить того же ревьюера повторно для той же статьи
   **Expected:** HTTP 409; дублирующее назначение не создаётся; UI показывает сообщение об ошибке

---

## TC-A-SESSION-004: Просмотр блока сессии с карточками ревьюеров

**US:** US-A10  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть ≥ 2 активных назначения для статьи

### Test Steps
1. Перейти на `/author/articles/[id]/review`
   **Expected:** Каждое назначение отображается отдельной карточкой: имя ревьюера, статус (цветной бейдж), дата назначения

---

## TC-A-CHAT-001: Написать сообщение в общий чат сессии

**US:** US-A8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть активное назначение (status=accepted)

### Test Steps
1. На `/author/articles/[id]/review` → найти область общего чата → ввести сообщение → «Отправить»
   **Expected:** Сообщение отображается в треде; ревьюер получает уведомление
2. Попытаться отправить пустое сообщение
   **Expected:** Клиентская валидация; форма не отправляется

---

## TC-A-GUIDE-001: Открытие руководства автора

**US:** US-A2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. На `/author` или `/author/articles/[id]` найти ссылку/кнопку «Руководство»
   **Expected:** Модальное окно или страница с руководством для авторов открывается; контент содержит инструкции по работе с платформой

---

## Inline Annotations (Фаза 30)

**Покрытие:** US-A32..A35

---

## TC-AU-ANNO-001: Подсветки аннотаций цветом по статусу

**US:** US-A32  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Есть назначение с inline-аннотациями от ревьюера (разные статусы: open и resolved)
- [ ] Ревьюер отправил ревью (batch submitted → комментарии visible)

### Test Steps
1. Открыть `/author/articles/[id]/review` → выбрать назначение
   **Expected:** Split-view: слева MDX с подсветками, справа треды

2. Проверить цвета подсветок
   **Expected:** Открытые аннотации = жёлтый; resolved = серый

3. Проверить пины в margin
   **Expected:** Пронумерованные пины с номерами; цвет соответствует статусу

---

## TC-AU-ANNO-002: Клик на подсветку → скролл к треду

**US:** US-A32  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Кликнуть на подсветку в левой панели
   **Expected:** Правая панель скроллится к соответствующему треду

2. Кликнуть на цитату в треде
   **Expected:** Левая панель скроллится к подсвеченному фрагменту

---

## TC-AU-ANNO-003: Осиротевшая аннотация → цитата + «Текст изменён»

**US:** US-A32  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Аннотация привязана к фрагменту, который автор удалил/изменил

### Test Steps
1. Открыть `/author/articles/[id]/review`
   **Expected:** Осиротевший тред показывает оригинальную цитату + бейдж «Текст изменён»; подсветка в левой панели отсутствует

---

## TC-AU-ANNO-004: Ответ на inline-аннотацию ревьюера

**US:** US-A33  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Сессия в статусе `open`
- [ ] Ревьюер оставил inline-аннотацию

### Test Steps
1. В правой панели найти тред → ввести ответ → «Ответить»
   **Expected:** Ответ появляется в треде; ревьюер получает уведомление `review_comment_reply`

---

## TC-AU-ANNO-005: Ответ скрыт при completed/declined сессии

**US:** US-A33  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Назначение в статусе `completed`

### Test Steps
1. Открыть `/author/articles/[id]/review`
   **Expected:** Поле ввода ответа скрыто; аннотации видны в read-only режиме

---

## TC-AU-ANNO-006: Применить предложенную правку — MDX обновлён

**US:** US-A34  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер создал suggestion на фрагмент текста
- [ ] Сессия `open`

### Test Steps
1. Найти тред типа suggestion → кликнуть «Применить правку»
   **Expected:** Подтверждение применения

2. Подтвердить
   **Expected:** MDX-источник статьи обновлён: оригинальный фрагмент заменён на предложенный; создана версия в `articleVersions`; тред автоматически resolved; бейдж «Правка применена» на треде

3. Перезагрузить страницу
   **Expected:** Изменения сохранены; предложенный текст видён в контенте статьи

---

## TC-AU-ANNO-007: Apply на изменённый фрагмент → «Текст изменился»

**US:** US-A34  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Ревьюер создал suggestion
- [ ] Автор отредактировал фрагмент, к которому привязан suggestion (текст изменился)

### Test Steps
1. Попытаться нажать «Применить правку»
   **Expected:** Кнопка заблокирована; сообщение «Текст изменился, примените вручную»

---

## TC-AU-ANNO-008: Уже применённый suggestion → кнопка заблокирована

**US:** US-A34  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Suggestion уже применён (resolved)

### Test Steps
1. Найти применённый suggestion-тред
   **Expected:** Бейдж «Правка применена»; кнопка «Применить» отсутствует или disabled

---

## TC-AU-ANNO-009: Race condition: 2 apply → первый выигрывает, второй 409

**US:** US-A34  
**Priority:** P1  
**Type:** Concurrency  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Один suggestion, два параллельных запроса apply (автор + админ)

### Test Steps
1. Одновременно отправить два `PUT /api/review-comments/[id]/apply-suggestion`
   **Expected:** Первый запрос → 200 (MDX обновлён); второй → 409 («Текст изменился»)

---

## TC-AU-ANNO-010: Пометить аннотацию как решённую → подсветка серая

**US:** US-A35  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Открытая аннотация от ревьюера

### Test Steps
1. В правой панели на треде → «Решить»
   **Expected:** Подсветка меняется на серую; пин серый; `resolvedAt` + `resolvedBy` заполнены

2. Проверить что ревьюер может переоткрыть
   **Expected:** Ревьюер видит кнопку «Переоткрыть» (US-RV16)

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Назначение `completed`/`declined` | Кнопка «Решить» скрыта |

---

## TC-AU-ANNO-011: Уведомление suggestion_applied отправлено ревьюеру

**US:** US-A34  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Автор применил suggestion (TC-AU-ANNO-006)

### Test Steps
1. Войти как ревьюер → проверить уведомления
   **Expected:** Уведомление типа `suggestion_applied` с ссылкой на статью и тред

---

## UX Review Hub (Фаза 34)

## TC-AU-UX-001: `/author/articles` — секция «На ревью» показывает статьи

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Автор имеет статью со статусом pending/accepted reviewAssignment

### Test Steps
1. Открыть `/author/articles`
   **Expected:** Над таблицей секция «На ревью» с карточкой статьи; видно количество ревьюеров + бейдж с числом открытых замечаний (если есть)

2. Фильтр `?filter=review`
   **Expected:** Показана только секция «На ревью», таблица со всеми статьями скрыта

---

## TC-AU-UX-002: Клик по карточке «На ревью» → unified review page

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Клик по карточке «На ревью»
   **Expected:** Переход на `/author/articles/{id}/review`; загружается unified view (MDX + sidebar chips)

---

## TC-AU-UX-003: Unified page показывает комментарии всех ревьюеров

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] 2+ ревьюера с комментариями на статье

### Test Steps
1. Открыть unified page
   **Expected:** Все комментарии обоих ревьюеров видны в сайдбаре; каждый тред имеет бейдж с именем ревьюера; цвет бейджа стабилен и уникален для каждого ревьюера

2. Проверить контраст бейджей в обеих темах (light/dark)
   **Expected:** Контраст текст/фон ≥ 4.5:1 (WCAG AA)

---

## TC-AU-UX-004: Chips-фильтр по ревьюеру

**US:** US-AU-UX  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. В unified view кликнуть на chip конкретного ревьюера
   **Expected:** В списке тредов остались только комментарии этого ревьюера

2. Кликнуть повторно на тот же chip или «Все»
   **Expected:** Фильтр сброшен, все комментарии видны

---

## TC-AU-UX-005: Apply suggestion — бейдж «Применена», toast, collapse

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Автор в unified view, есть thread с suggestion (не применён)

### Test Steps
1. Кликнуть «Применить» в треде-suggestion
   **Expected:** Появляется toast «Правка применена» (2.5 с); тред меняет бордер на зелёный; пин становится «✓»; бейдж «Применена» виден; исходник suggestion сворачивается в `<details>`

2. Перезагрузить страницу
   **Expected:** Состояние «Применена» сохранено (возвращается с сервера, `appliedAt !== null`)

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Race (повторный клик) | 409 → toast «Правка уже применена», refreshComments |
| Контент изменился | 422 → модал с diff (original/suggestion) |

---

## TC-AU-UX-006: Кнопка «Открыть сессию N» — deep-link

**US:** US-AU-UX  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. В сайдбаре unified view кликнуть на ссылку конкретного ревьюера («Открыть отдельные сессии»)
   **Expected:** Переход на `/author/articles/{id}/review/{assignmentId}`; старый single-reviewer view работает (обратная совместимость)

---

## TC-AU-UX-007: Дизайн — тред-карточка без nested-borders

**US:** US-AU-UX  
**Priority:** P2  
**Type:** Visual / Regression  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть unified view с несколькими тредами
   **Expected:** Каждый тред имеет только `border-l-4` цветного статуса (open=warning, applied=success, resolved=success/60, orphan=danger, pending=muted); нет `rounded-lg border` вокруг карточки; reply-блоки не имеют собственной рамки

2. Переключить тему dark/light
   **Expected:** Цвета бордеров соответствуют CSS-переменным; контраст сохранён
