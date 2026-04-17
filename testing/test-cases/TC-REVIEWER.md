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

---

## Inline Annotations (Фаза 30)

**Покрытие:** US-RV6 (обновлён), US-RV7 (обновлён), US-RV8 (обновлён), US-RV17..RV23

---

## TC-RV-ANNO-001: Подсветки аннотаций видны на тексте статьи

**US:** US-RV6  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Есть назначение в статусе `accepted` с существующими inline-аннотациями (создать через API)
- [ ] Статья содержит MDX с текстом, кодом и формулами

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Левая панель отображает полный MDX-контент (prose, code blocks, KaTeX, Mermaid)

2. Проверить подсветки аннотаций
   **Expected:** Фрагменты текста, к которым привязаны аннотации, подсвечены (CSS Custom Highlight API или fallback `<mark>`)

3. Навести курсор на подсветку
   **Expected:** Tooltip с первой строкой комментария аннотации

4. Кликнуть на подсветку
   **Expected:** Правая панель скроллится к соответствующему треду

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Highlight API недоступен (старый браузер) | Fallback на `<mark>` элементы |
| Нет аннотаций | Текст без подсветок, правая панель пустая |

---

## TC-RV-ANNO-002: Пронумерованные пины в margin

**US:** US-RV6  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть назначение с 3+ аннотациями на разных позициях текста

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** В правом margin каждой аннотации отображается пронумерованный пин (1, 2, 3...), выровненный по якорю

2. Кликнуть на пин
   **Expected:** Правая панель скроллится к соответствующему треду

---

## TC-RV-ANNO-003: Клик на пин → скролл к треду

**US:** US-RV6  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Длинная статья с аннотациями внизу и вверху

### Test Steps
1. Кликнуть на пин внизу статьи
   **Expected:** Правая панель скроллится к треду; тред визуально выделен (highlight на 1 сек)

2. В правой панели кликнуть на цитату в треде
   **Expected:** Левая панель скроллится к подсвеченному фрагменту

---

## TC-RV-ANNO-004: Fallback на `<mark>` без Highlight API

**US:** US-RV6  
**Priority:** P2  
**Type:** Compatibility  
**Estimated Time:** 3 мин

### Test Steps
1. Открыть страницу в браузере без CSS Custom Highlight API (или замокировать отсутствие)
   **Expected:** Аннотации подсвечены через `<mark>` элементы; функциональность (клик, tooltip) сохраняется

---

## TC-RV-ANNO-005: Осиротевшая аннотация → бейдж «Текст изменён»

**US:** US-RV6  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Аннотация привязана к фрагменту текста
- [ ] Автор изменил статью — аннотированный фрагмент удалён

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Подсветка осиротевшей аннотации не рендерится в левой панели

2. Найти тред в правой панели
   **Expected:** Тред показывает оригинальную цитату + бейдж «Текст изменён»

---

## TC-RV-ANNO-006: Создание inline-аннотации через выделение текста

**US:** US-RV7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Выделить фрагмент текста в левой панели
   **Expected:** Над выделением появляется floating-popover с кнопкой «💬 Комментировать»

2. Кликнуть «💬 Комментировать»
   **Expected:** В правой панели открывается новый тред с процитированным фрагментом и полем ввода

3. Ввести текст комментария → «Отправить»
   **Expected:** Тред создаётся; фрагмент подсвечивается в левой панели; пин появляется в margin

---

## TC-RV-ANNO-007: Triple anchoring сохраняется в БД

**US:** US-RV7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Создана inline-аннотация (TC-RV-ANNO-006)

### Test Steps
1. Проверить запись в БД (через API GET)
   **Expected:** Комментарий содержит `anchorData` с тремя селекторами:
   - `textQuote`: `{ exact, prefix, suffix }`
   - `textPosition`: `{ start, end }`
   - `mdxOffset`: `{ start, end }`

2. Перезагрузить страницу
   **Expected:** Аннотация отображается на том же месте (re-anchoring работает)

---

## TC-RV-ANNO-008: Выделение через границу MDX-компонента → popover не появляется

**US:** US-RV7  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит KaTeX-формулу или Mermaid-диаграмму

### Test Steps
1. Попытаться выделить текст, включая часть обычного текста и часть формулы/диаграммы
   **Expected:** Floating-popover НЕ появляется; подсказка «Выделите текст в пределах одного блока»

---

## TC-RV-ANNO-009: Пустой комментарий → клиентская валидация

**US:** US-RV7  
**Priority:** P1  
**Type:** Validation  
**Estimated Time:** 2 мин

### Test Steps
1. Выделить текст → «Комментировать» → оставить поле пустым → «Отправить»
   **Expected:** Клиентская валидация: «Введите текст комментария»; запрос на сервер не отправляется

---

## TC-RV-ANNO-010: Статус не pending/accepted → popover не появляется

**US:** US-RV7  
**Priority:** P1  
**Type:** Edge case  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Назначение в статусе `completed` или `declined`

### Test Steps
1. Попытаться выделить текст в левой панели
   **Expected:** Floating-popover НЕ появляется; нельзя создать новую аннотацию

---

## TC-RV-ANNO-011: Цитирование в существующий тред

**US:** US-RV8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть хотя бы один открытый тред

### Test Steps
1. Выделить другой фрагмент текста → popover
   **Expected:** Popover содержит опцию «Цитировать в тред»

2. Кликнуть «Цитировать в тред» → выбрать тред из списка
   **Expected:** Цитата вставляется в поле ответа выбранного треда как blockquote

3. Отправить ответ
   **Expected:** Ответ содержит цитату с якорем; клик на цитату скроллит к фрагменту

---

## TC-RV-ANNO-012: Нет открытых тредов → «Цитировать в тред» скрыт

**US:** US-RV8  
**Priority:** P2  
**Type:** Edge case  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Все треды resolved или нет тредов

### Test Steps
1. Выделить текст → popover
   **Expected:** Опция «Цитировать в тред» отсутствует; доступно только «Комментировать»

---

## TC-RV-ANNO-013: Комментарий к code block через hover-кнопку

**US:** US-RV17  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья содержит code block
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Навести курсор на code block
   **Expected:** Слева от блока появляется кнопка «💬»

2. Кликнуть кнопку «💬»
   **Expected:** В правой панели открывается тред с типом «Код» + первые 100 символов кода

3. Ввести комментарий → «Отправить»
   **Expected:** Тред создаётся; пин в margin рядом с блоком

---

## TC-RV-ANNO-014: Комментарий к KaTeX-формуле

**US:** US-RV17  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит `$$...$$` формулу

### Test Steps
1. Навести курсор на формулу → кликнуть «💬»
   **Expected:** Тред создаётся с типом «Формула» + превью формулы

---

## TC-RV-ANNO-015: Комментарий к Mermaid-диаграмме

**US:** US-RV17  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит `<Mermaid chart={...}>`

### Test Steps
1. Навести курсор на диаграмму → кликнуть «💬»
   **Expected:** Тред создаётся с типом «Диаграмма» + первые 100 символов chart

---

## TC-RV-ANNO-016: Комментарий к ArticleImage/ArticleVideo

**US:** US-RV17  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит `<ArticleImage>` или `<ArticleVideo>`

### Test Steps
1. Навести курсор на изображение/видео → кликнуть «💬»
   **Expected:** Тред создаётся с типом «Изображение» / «Видео» + URL превью

---

## TC-RV-ANNO-017: Создание suggestion через «Предложить правку»

**US:** US-RV18  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Назначение в статусе `accepted`

### Test Steps
1. Выделить фрагмент текста → popover → «✏️ Предложить правку»
   **Expected:** В правой панели открывается тред с оригинальным текстом (нередактируемый) + textarea для предложенного варианта

2. Ввести предложенный текст → «Отправить»
   **Expected:** Тред создаётся с типом `suggestion`

---

## TC-RV-ANNO-018: Suggestion отображается как diff (красный/зелёный)

**US:** US-RV18  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Создан suggestion (TC-RV-ANNO-017)

### Test Steps
1. Найти тред suggestion в правой панели
   **Expected:** Визуально: зачёркнутый оригинал (красный фон) + предложенный текст (зелёный фон)

2. Проверить наличие кнопки «Применить» (для автора/админа)
   **Expected:** Кнопка «Применить» видна автору/админу; ревьюеру — не видна

---

## TC-RV-ANNO-019: Пустое предложение → валидация

**US:** US-RV18  
**Priority:** P1  
**Type:** Validation  
**Estimated Time:** 2 мин

### Test Steps
1. «Предложить правку» → оставить textarea пустой → «Отправить»
   **Expected:** Валидация: «Введите предложенный текст»

---

## TC-RV-ANNO-020: Прогресс-бар: счётчики open/resolved/suggestions/checklist

**US:** US-RV19  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Назначение с несколькими аннотациями в разных статусах (open, resolved) + suggestion + чеклист

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Верхняя панель отображает: `Открыто: N · Решено: M · Предложения: K · Чеклист: X/Y`

2. Resolve один тред → проверить обновление
   **Expected:** Счётчики обновились; progress bar увеличился

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет комментариев | Прогресс-бар скрыт |

---

## TC-RV-ANNO-021: Фильтрация тредов: Все/Открытые/Решённые/Предложения/Без ответа

**US:** US-RV20  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Назначение с тредами в разных статусах

### Test Steps
1. Переключить таб «Открытые»
   **Expected:** Показаны только открытые треды; подсветки в левой панели соответствуют фильтру; счётчик на табе

2. Переключить «Решённые»
   **Expected:** Показаны только resolved треды

3. Переключить «Предложения»
   **Expected:** Показаны только треды типа `suggestion`

4. Переключить «Без ответа»
   **Expected:** Показаны треды верхнего уровня без ответов от автора/админа

---

## TC-RV-ANNO-022: Навигация клавишами N/P между тредами

**US:** US-RV21  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Нажать `N`
   **Expected:** Правая панель скроллится к следующему открытому треду; левая панель скроллится к якорю; подсветка мигает 1 сек

2. Нажать `P`
   **Expected:** Скролл к предыдущему треду

---

## TC-RV-ANNO-023: ⌘↵ отправляет комментарий

**US:** US-RV21  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть поле ответа в треде → ввести текст → нажать `⌘↵` (или `Ctrl+Enter`)
   **Expected:** Комментарий отправлен без клика на кнопку

---

## TC-RV-ANNO-024: Toggle показа изменений с момента назначения

**US:** US-RV22  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья изменена после создания назначения

### Test Steps
1. Включить переключатель «Показать изменения» над левой панелью
   **Expected:** Добавленный текст подсвечен зелёным фоном; удалённый — красным с зачёркиванием; бейдж «Изменено с момента вашего ревью: N блоков»

2. Проверить что аннотации по-прежнему видны
   **Expected:** Подсветки аннотаций накладываются поверх подсветки изменений

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет изменений | Переключатель неактивен (disabled) |

---

## TC-RV-ANNO-025: Комментарии создаются как pending_batch

**US:** US-RV23  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. Создать inline-аннотацию (через выделение текста → «Комментировать»)
   **Expected:** Комментарий имеет `batchStatus: "pending_batch"`; виден только текущему ревьюеру

2. Создать ещё одну аннотацию
   **Expected:** Оба комментария pending_batch; кнопка «Отправить ревью» показывает счётчик (2)

---

## TC-RV-ANNO-026: Pending batch невидимы другим ревьюерам и автору

**US:** US-RV23  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер 1 создал pending_batch комментарии
- [ ] Ревьюер 2 также назначен на ту же сессию

### Test Steps
1. Войти как ревьюер 2 → открыть то же назначение
   **Expected:** Pending_batch комментарии ревьюера 1 НЕ видны

2. Войти как автор статьи → открыть ревью
   **Expected:** Pending_batch комментарии НЕ видны

3. Войти как админ → открыть ревью статьи
   **Expected:** Pending_batch комментарии ВИДНЫ (admin override)

---

## TC-RV-ANNO-027: «Отправить ревью» → все batch visible + уведомление review_submitted

**US:** US-RV23  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Ревьюер создал 3+ pending_batch комментариев

### Test Steps
1. Кликнуть «Отправить ревью» → модал с выбором вердикта
   **Expected:** Модал показывает количество комментариев (N); радиокнопки вердикта; textarea для общей заметки

2. Выбрать вердикт → подтвердить
   **Expected:** Все pending_batch комментарии стали `visible`; автор получил уведомление `review_submitted` с вердиктом и количеством комментариев; кнопка «Отправить ревью» скрыта (batch одноразовый)

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Нет pending комментариев | Кнопка «Отправить ревью» заблокирована |
| После отправки batch ревьюер создаёт новый комментарий | Новый комментарий visible сразу (не batch) |

---

## Diagrams in Review (Фаза 34)

## TC-RV-DIAG-001: Открытие ревью-страницы статьи с Mermaid — нет JS-ошибок

**US:** US-RV-DIAG  
**Priority:** P0  
**Type:** Functional / Regression  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит `<Mermaid chart="..."/>` (flowchart)
- [ ] Статья отправлена на ревью, ревьюер принял назначение

### Test Steps
1. Открыть DevTools → Console, очистить лог
2. Открыть `/reviewer/assignments/{id}`
   **Expected:** Страница отрисована полностью; рендер диаграммы виден; консоль без ошибок (`Cannot read properties of undefined (reading 'replace')` отсутствует)

3. Ниже рендера видно `<details>` «Показать исходник»; раскрыть
   **Expected:** Показан исходник `chart` как plain-text code block с моноширинным шрифтом

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Mermaid с пустым chart | Fallback `<pre>` без ошибок |
| JSX-атрибут без значения (`<Mermaid chart={}/>`) | Страница не падает, Fallback |

---

## TC-RV-DIAG-002: Kroki `<Diagram/>` недоступен → Fallback

**US:** US-RV-DIAG  
**Priority:** P0  
**Type:** Functional / Resilience  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит `<Diagram type="plantuml" chart="..."/>`
- [ ] Kroki-сервис временно недоступен (можно эмулировать через блок сети)

### Test Steps
1. Открыть `/reviewer/assignments/{id}`
   **Expected:** Видно Fallback-блок с исходником `chart`; страница не падает; нет JS-ошибок

2. Раскрыть `<details>` «Показать исходник»
   **Expected:** Исходник виден, selectable; можно выделить → открывается popover для создания annotation

---

## TC-RV-DIAG-003: Выделение в исходнике диаграммы → создание annotation

**US:** US-RV-DIAG  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья с `<Mermaid/>`, ревьюер в accepted-статусе

### Test Steps
1. Раскрыть `<details>` с исходником
2. Выделить несколько строк кода диаграммы
   **Expected:** Появляется selection-popover с кнопками «Комментарий / Правка»

3. Написать комментарий, отправить (в batch)
   **Expected:** Появляется пин-маркер у выделения; thread виден в сайдбаре

---

## TC-RV-DIAG-004: Circuit (TikZ) — рендер + toggle

**US:** US-RV-DIAG  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/reviewer/assignments/{id}` для статьи с `<Circuit code="..."/>`
   **Expected:** SVG-рендер виден; `<details>` с исходником доступен; нет ошибок

---

## TC-RV-DIAG-005: `prefers-reduced-motion` на ревью-странице

**US:** US-RV-DIAG  
**Priority:** P2  
**Type:** Accessibility  
**Estimated Time:** 2 мин

### Test Steps
1. Включить `prefers-reduced-motion: reduce` в OS / DevTools
2. Открыть `/reviewer/assignments/{id}` со статьёй с диаграммами
   **Expected:** Рендер статичен; `<details>` раскрывается без анимации; пины не моргают

---

## Multi-reviewer (Фаза 34)

## TC-MULTI-001: Два ревьюера комментируют → автор видит оба в unified view

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 6 мин

### Preconditions
- [ ] Статья имеет 2 активных назначения (ревьюер A и B)
- [ ] Каждый ревьюер опубликовал ≥1 комментарий (batch submitted)

### Test Steps
1. Войти как автор → `/author/articles/{id}/review`
   **Expected:** Открылся unified view; в сайдбаре chips-фильтр с обоими ревьюерами + «Все»; комментарии обоих видны в сайдбаре

2. Каждая карточка треда имеет бейдж с именем ревьюера с уникальным цветом
   **Expected:** Цвет стабилен (одинаковый между перезагрузками)

---

## TC-MULTI-002: Security — ревьюер B не видит pending batch ревьюера A

**US:** US-AU-UX  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Ревьюер A создал pending batch (не submitted)
- [ ] Ревьюер B имеет активное назначение на ту же статью

### Test Steps
1. Войти как автор статьи → GET `/api/author/articles/{id}/review-comments`
   **Expected:** Ответ не содержит pending комментариев ревьюера A (`batchId !== null` отфильтрованы)

2. Войти как автор → unified view
   **Expected:** Комментарии A (pending) не видны; submitted комментарии видны

3. Попытка автора другой статьи: GET `/api/author/articles/{id}/review-comments` с чужим `id`
   **Expected:** 404 «Не найдено»

---

## TC-MULTI-003: Автор применяет suggestion ревьюера A → ревьюер B видит обновлённый MDX

**US:** US-AU-UX  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Test Steps
1. Автор в unified view применяет suggestion ревьюера A
   **Expected:** Тред показывает бейдж «Применена», `<details>` с исходником сворачивается; toast «Правка применена»

2. Ревьюер B обновляет свою ревью-страницу
   **Expected:** Видит обновлённый MDX (изменение применено)

---

## TC-MULTI-004: Счётчик новых замечаний в карточке «На ревью»

**US:** US-AU-UX  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья с N открытыми (unresolved) замечаниями от ревьюеров

### Test Steps
1. Открыть `/author/articles` 
   **Expected:** В секции «На ревью» карточка статьи с бейджем «N замечаний»

2. Разрешить одно замечание (`/author/articles/{id}/review`)
   **Expected:** При следующей загрузке `/author/articles` бейдж показывает N-1
