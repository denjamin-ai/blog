# Test Cases: РЕВЬЮЕР (role: reviewer)

**Покрытие:** US-RV1..RV16  
**Тестовый аккаунт:** никнейм `reviewer`, пароль `password` (роль `reviewer`)

---

## TC-RV-001: Вход ревьюера — успешный

**US:** US-RV1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/login`, ввести `reviewer` / `password`
   **Expected:** Редирект на `/reviewer`

---

## TC-RV-002: Дашборд ревьюера — сводка

**US:** US-RV2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть назначения в разных статусах (pending, accepted, completed)

### Test Steps
1. Открыть `/reviewer`
   **Expected:** 3 карточки-ссылки: «Ожидают (N)», «В работе (N)», «Завершено (N)»; числа соответствуют реальному количеству

---

## TC-RV-003: Список назначений с фильтрацией

**US:** US-RV3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Test Steps
1. Открыть `/reviewer/assignments`
   **Expected:** Список карточек: заголовок статьи, цветной бейдж статуса, дата назначения, дата обновления

2. Переключить таб фильтра (pending / accepted / completed)
   **Expected:** Список фильтруется по статусу

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет назначений | Сообщение «Нет назначений» |
| Назначения другого ревьюера | Не отображаются (изоляция данных) |

---

## TC-RV-004: Принять задание на ревью

**US:** US-RV4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть назначение в статусе `pending` для этого ревьюера

### Test Steps
1. Кликнуть карточку назначения → открывается `/reviewer/assignments/[id]`

2. Нажать «Принять»
   **Expected:** Статус → `accepted`; кнопки меняются на «Завершить» + «Отклонить»

3. Проверить уведомление у администратора
   **Expected:** Уведомление типа `assignment_accepted` создано

---

## TC-RV-005: Принять уже не-pending назначение — ошибка

**US:** US-RV4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Назначение в статусе `accepted` (уже принято)

### Test Steps
1. `PATCH /api/reviewer/assignments/[id]` с `{ status: "accepted" }`
   **Expected:** HTTP 400 или 422

---

## TC-RV-006: Отклонить задание (из pending)

**US:** US-RV5  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Назначение в статусе `pending`

### Test Steps
1. На странице назначения → «Отклонить»
   **Expected:** Статус → `declined`; форма комментариев скрывается; уведомление `assignment_declined` у админа

---

## TC-RV-007: Отклонить задание (из accepted)

**US:** US-RV5  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Нажать «Отклонить»
   **Expected:** Статус → `declined`; уведомление `assignment_declined`

---

## TC-RV-008: Чтение статьи для ревью

**US:** US-RV6  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть `/reviewer/assignments/[id]` (статус `accepted`)
   **Expected:** Левая панель — полный MDX-контент статьи (версия на момент назначения)

---

## TC-RV-009: Изоляция — ревьюер видит только свои назначения

**US:** US-RV3 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `GET /api/reviewer/assignments/[id_чужого_назначения]`
   **Expected:** HTTP 403

---

## TC-RV-010: Оставить комментарий ревью

**US:** US-RV7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. В правой панели ввести текст → «Отправить»
   **Expected:** Комментарий появляется в треде; уведомление `review_comment_reply` у автора/админа

2. Попытаться оставить пустой комментарий
   **Expected:** Клиентская валидация; не отправляется

---

## TC-RV-011: Комментарий при завершённом ревью — запрет

**US:** US-RV7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Назначение в статусе `completed` или `declined`

### Test Steps
1. Форма комментариев должна быть скрыта
2. `POST /api/assignments/[id]/review-comments` с текстом
   **Expected:** HTTP 403 или 422

---

## TC-RV-012: Цитирование фрагмента статьи

**US:** US-RV8  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Выделить фрагмент текста в левой панели
   **Expected:** Всплывает кнопка «Процитировать»

2. Нажать «Процитировать»
   **Expected:** Выделенный текст вставляется в форму комментария с якорем

3. Отправить комментарий
   **Expected:** Комментарий сохранён с `quotedText` и `quotedAnchor`

---

## TC-RV-013: Завершить ревью — успешно с вердиктом

**US:** US-RV9, US-RV14  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Нажать «Завершить»
   **Expected:** Открывается модал с выбором вердикта

2. Выбрать `approved`, ввести заметку «Статья готова к публикации», подтвердить
   **Expected:** Статус → `completed`; вердикт и заметка сохранены; форма комментариев скрывается; уведомление `review_completed` у админа

---

## TC-RV-014: Завершить ревью — без вердикта (ошибка)

**US:** US-RV14  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. `PATCH /api/reviewer/assignments/[id]` с `{ status: "completed" }` без `verdict`
   **Expected:** HTTP 422; назначение не завершено

---

## TC-RV-015: Завершить ревью — verdictNote > 1000 символов

**US:** US-RV14  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Отправить `verdictNote` длиной 1001+ символ
   **Expected:** Валидация; ошибка

---

## TC-RV-016: История версий статьи

**US:** US-RV10  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья имеет несколько версий; одна создана до назначения, другая — после

### Test Steps
1. Открыть `/reviewer/assignments/[id]/versions`
   **Expected:** Только версии до даты назначения; «назначенная» версия имеет бейдж; превью контента 200 символов

2. Проверить, что версии после даты назначения не отображаются
   **Expected:** Версии после `assignment.createdAt` отсутствуют в списке

---

## TC-RV-017: Уведомления ревьюера

**US:** US-RV11  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть `/reviewer/notifications`
   **Expected:** Список уведомлений; типы: `assignment_created`, `review_comment_reply`, `article_updated`

2. Проверить `NotificationBadge` обновляется при наличии непрочитанных
   **Expected:** Бейдж с числом непрочитанных

---

## TC-RV-018: Выход ревьюера

**US:** US-RV12  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Нажать «Выйти»
   **Expected:** Сессия очищена; редирект на `/login`

---

## TC-RV-019: Заполнить чеклист

**US:** US-RV13  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Назначение в статусе `accepted`; чеклист создан из шаблона

### Test Steps
1. Открыть `/reviewer/assignments/[id]`, найти секцию «Чеклист»
   **Expected:** Список пунктов из шаблона, все изначально не отмечены

2. Отметить несколько пунктов, сохранить
   **Expected:** `PUT /api/reviewer/assignments/[id]/checklist` → HTTP 200; состояние чеклиста сохранено

3. Перезагрузить страницу
   **Expected:** Отмеченные пункты сохранены

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Статус `completed` | Чеклист только для чтения |

---

## TC-RV-020: Diff с момента назначения

**US:** US-RV15  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья изменена после создания назначения

### Test Steps
1. Открыть `/reviewer/assignments/[id]` → вкладка/кнопка «Diff»
   **Expected:** `GET /api/reviewer/assignments/[id]/diff` → `{ hasChanges: true }`; визуальное сравнение (old vs new)

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Статья не изменялась | `hasChanges: false`; сообщение «Изменений нет» |

---

## TC-RV-021: Переоткрыть решённый комментарий

**US:** US-RV16  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Назначение `accepted`; комментарий помечен как решённый автором

### Test Steps
1. Найти комментарий с меткой «Решён», нажать «Переоткрыть»
   **Expected:** `PUT /api/review-comments/[id]/resolve` `{ resolved: false }` → HTTP 200; `resolvedAt` сброшен; уведомление `review_comment_reopened` у автора/админа

---

## TC-RV-022: Переоткрыть при завершённом ревью — запрет

**US:** US-RV16  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Назначение в статусе `completed` или `declined`

### Test Steps
1. `PUT /api/review-comments/[id]/resolve` `{ resolved: false }`
   **Expected:** HTTP 403 или 422

---

## TC-RV-023: Ревьюер не видит чужие назначения — изоляция

**US:** US-RV3 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `GET /api/reviewer/assignments` → проверить, что в ответе только назначения текущего ревьюера
   **Expected:** Чужие назначения отсутствуют

---

## TC-RV-024: Ревьюер не может получить доступ к admin-разделу

**US:** US-RV1 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. Авторизоваться как `reviewer`, открыть `/admin`
   **Expected:** HTTP 403 или редирект на `/admin/login`

---

## Сессия и общий чат

## TC-RV-CHAT-001: Читать сообщения от других ревьюеров и автора

**US:** US-RV7  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Назначение в статусе `accepted`; в треде есть сообщения от автора или другого ревьюера

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Общий тред отображается; видны сообщения от других участников с именами и временем

---

## TC-RV-CHAT-002: Написать сообщение в общий чат, проверить видимость

**US:** US-RV7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. На `/reviewer/assignments/[id]` → ввести текст → «Отправить»
   **Expected:** Сообщение появляется в треде; уведомление `review_comment_reply` у автора/админа
2. Проверить видимость сообщения у администратора на `/admin/articles/[id]/review`
   **Expected:** Сообщение ревьюера отображается в том же треде

---

## TC-RV-SESSION-001: Видеть участников сессии и их статусы

**US:** US-RV3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья имеет ≥ 2 назначения (от разных ревьюеров)

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Видна информация о назначении; возможно отображение статусов других ревьюеров сессии (если реализовано)

---

## TC-RV-SESSION-002: Ревьюер не из сессии → 403

**US:** US-RV3 (security)  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. Авторизоваться как ревьюер, у которого нет назначения для данной статьи
2. Попытаться открыть `/reviewer/assignments/[id_чужого_назначения]`
   **Expected:** HTTP 403

---

## TC-RV-GUIDE-001: Открытие руководства ревьюера

**US:** US-RV2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. На `/reviewer` или `/reviewer/assignments/[id]` найти ссылку/кнопку «Руководство»
   **Expected:** Модальное окно или страница с руководством для ревьюеров открывается; контент содержит инструкции по процессу ревью
