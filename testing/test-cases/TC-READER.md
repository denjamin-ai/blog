# Test Cases: ЧИТАТЕЛЬ (role: reader)

**Покрытие:** US-R1..R13  
**Тестовый аккаунт:** никнейм `reader`, пароль `password` (роль `reader`)

---

## TC-R-001: Вход в систему — успешный

**US:** US-R1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Аккаунт читателя создан (`reader` / `password`)
- [ ] Пользователь не авторизован

### Test Steps
1. Открыть `/login`
   **Expected:** Форма с полями «Никнейм» и «Пароль»

2. Ввести никнейм `reader`, пароль `password`, нажать «Войти»
   **Expected:** Редирект на `/`; сессия установлена (`role=reader`); нет поля для email

### Test Data
| Поле | Значение |
|------|---------|
| Никнейм | `reader` |
| Пароль | `password` |

---

## TC-R-002: Вход в систему — неверный пароль

**US:** US-R1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/login`, ввести `reader` / `wrongpassword`, нажать «Войти»
   **Expected:** Сообщение об ошибке на форме; редиректа нет; сессия не установлена

---

## TC-R-003: Вход в систему — несуществующий никнейм

**US:** US-R1  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Ввести несуществующий никнейм `ghost_user_99999` / любой пароль
   **Expected:** Сообщение об ошибке; сессия не установлена

---

## TC-R-004: Оставить комментарий — успешно

**US:** US-R2  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Авторизован как `reader`
- [ ] Статья опубликована

### Test Steps
1. Открыть `/blog/[slug]`, прокрутить до секции комментариев
   **Expected:** Видна форма ввода текста комментария

2. Ввести текст «Тестовый комментарий», нажать «Отправить»
   **Expected:** Комментарий появляется в списке с именем читателя и текущей датой

### Post-conditions
- Удалить тестовый комментарий после проверки

---

## TC-R-005: Комментарий — заблокированный читатель

**US:** US-R2  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Читатель имеет `commentingBlocked=1` (установлено через Admin)

### Test Steps
1. Авторизоваться как заблокированный читатель, открыть статью
   **Expected:** Форма комментария либо скрыта, либо при отправке возвращает ошибку 403

2. Попытка `POST /api/articles/[id]/comments`
   **Expected:** HTTP 403

---

## TC-R-006: Ответ на комментарий (вложенность 1 уровень)

**US:** US-R3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Есть корневой комментарий

### Test Steps
1. Нажать «Ответить» под комментарием → ввести текст → «Отправить»
   **Expected:** Ответ появляется с отступом под родительским; оба видны

---

## TC-R-007: Ответ на комментарий — блокировка 3-го уровня

**US:** US-R3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть комментарий 2-го уровня вложенности (ответ на ответ)

### Test Steps
1. Открыть комментарий второго уровня
   **Expected:** Кнопка «Ответить» отсутствует

2. Попытка `POST /api/articles/[id]/comments` с `parentId` комментария 2-го уровня
   **Expected:** HTTP 400 или 422 (сервер блокирует 3-й уровень)

---

## TC-R-008: Редактирование комментария — в рамках 15 минут

**US:** US-R4  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Читатель только что оставил комментарий (< 15 мин назад)

### Test Steps
1. Найти свой свежий комментарий, нажать «Редактировать»
   **Expected:** Поле ввода с текущим текстом

2. Изменить текст, сохранить
   **Expected:** Текст обновился; появилась пометка «(ред.)»

---

## TC-R-009: Редактирование комментария — вне 15-минутного окна

**US:** US-R4  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Комментарий оставлен более 15 минут назад (можно искусственно изменить timestamp в dev)

### Test Steps
1. Попытка `PUT /api/articles/[id]/comments/[commentId]` с телом `{ content: "изменено" }`
   **Expected:** HTTP 403

2. Проверить UI: кнопка «Редактировать» должна быть скрыта или задизейблена

---

## TC-R-010: Удаление своего комментария

**US:** US-R5  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Нажать «Удалить» на своём комментарии → подтвердить
   **Expected:** Комментарий заменяется текстом «[удалено]»; дочерние ответы остаются видимыми

---

## TC-R-011: Удаление чужого комментария — запрет

**US:** US-R5  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 2 мин

### Test Steps
1. `DELETE /api/articles/[id]/comments/[чужой_commentId]`
   **Expected:** HTTP 403

---

## TC-R-012: VersionWarning — комментарий к старой версии

**US:** US-R6  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Статья отредактирована после того, как читатель оставил комментарий
- [ ] Комментарий привязан к старой `articleVersionId`

### Test Steps
1. Открыть статью
   **Expected:** Рядом с комментарием виден `VersionWarning` с датой старой версии

---

## TC-R-013: Выход из системы

**US:** US-R7  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Авторизован как `reader`

### Test Steps
1. Нажать кнопку «Выйти» в навигации
   **Expected:** Сессия очищена; при попытке перейти на `/bookmarks` — редирект на `/login`

---

## TC-R-014: Голосование за статью — добавить голос

**US:** US-R8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как `reader`
- [ ] Открыта чужая опубликованная статья

### Test Steps
1. Нажать кнопку «+1» (`ArticleVoting`)
   **Expected:** Голос учтён; кнопка «+1» визуально активна; счётчик изменился

2. Нажать «+1» повторно
   **Expected:** Голос отменён; кнопка вернулась в неактивное состояние; счётчик вернулся

3. Нажать «+1», затем «−1»
   **Expected:** Голос переключился на «−1»; «+1» неактивна, «−1» активна

---

## TC-R-015: Голосование за статью — запрет для заблокированного

**US:** US-R8  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Читатель имеет `commentingBlocked=1`

### Test Steps
1. `POST /api/articles/[id]/votes` с `{ value: 1 }`
   **Expected:** HTTP 403

---

## TC-R-016: Голосование за статью — rate-limit

**US:** US-R8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Test Steps
1. Быстро выполнить 2 запроса `POST /api/articles/[id]/votes` подряд (< 1 секунды)
   **Expected:** Второй запрос возвращает HTTP 429

---

## TC-R-017: Голосование за свою статью — запрет

**US:** US-R8  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Авторизован как пользователь, являющийся автором статьи

### Test Steps
1. `POST /api/articles/[id]/votes` для собственной статьи
   **Expected:** HTTP 403

---

## TC-R-018: Закладка — добавить и удалить

**US:** US-R9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Авторизован как `reader`

### Test Steps
1. Открыть карточку или страницу статьи, нажать `BookmarkButton`
   **Expected:** Кнопка меняет состояние (активна); счётчик закладок увеличился

2. Нажать повторно
   **Expected:** Закладка удалена; кнопка вернулась в неактивное состояние; счётчик уменьшился

---

## TC-R-019: Счётчик закладок — виден гостю

**US:** US-R9  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть статью как гость (без авторизации)
   **Expected:** Публичный счётчик закладок виден; кнопка добавления закладки недоступна (или ведёт на `/login`)

---

## TC-R-020: Страница закладок

**US:** US-R10  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Авторизован как `reader`, добавлено ≥ 2 закладки

### Test Steps
1. Перейти на `/bookmarks`
   **Expected:** Список сохранённых статей с заголовком, аннотацией, тегами, датой добавления; отсортирован от новых к старым

2. Нажать «Удалить из закладок» на одной из статей
   **Expected:** Статья исчезает из списка

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Закладок нет | Отображается пустое состояние |
| Не авторизован | Редирект на `/login` |

---

## TC-R-021: Подписка на автора

**US:** US-R11  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Авторизован как `reader`
- [ ] Автор имеет заполненный slug

### Test Steps
1. Открыть `/authors/[slug]`, нажать `SubscribeButton`
   **Expected:** Кнопка меняет состояние (подписан); запись в `subscriptions`

2. Нажать повторно (отписаться)
   **Expected:** Кнопка вернулась в состояние «Подписаться»; запись удалена из `subscriptions`

3. `GET /api/subscriptions`
   **Expected:** Список подписок соответствует текущему состоянию

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Не авторизован | HTTP 401 |

---

## TC-R-022: Голосование за комментарий

**US:** US-R12  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как `reader`; есть чужой публичный комментарий

### Test Steps
1. Нажать «+1» / «−1» рядом с чужим комментарием
   **Expected:** Голос учтён; toggle/switch работает аналогично вотингу статьи

2. Попытка проголосовать за свой комментарий
   **Expected:** HTTP 403

---

## TC-R-023: Уведомления читателя — новая статья от подписанного автора

**US:** US-R13  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Читатель подписан на автора
- [ ] Администратор публикует новую статью этого автора

### Test Steps
1. Открыть `/notifications` (или кликнуть `NotificationBadge`)
   **Expected:** Уведомление типа `new_article_by_subscribed_author` с заголовком статьи

2. Кликнуть на уведомление
   **Expected:** Переход к статье; уведомление помечается как прочитанное

---

## TC-R-024: Уведомления читателя — ответ на комментарий

**US:** US-R13  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Читатель оставил комментарий; другой пользователь ответил

### Test Steps
1. Открыть `/notifications`
   **Expected:** Уведомление типа `public_comment_reply`

2. Нажать «Отметить все прочитанными»
   **Expected:** Все уведомления помечены прочитанными; `NotificationBadge` обнуляется

---

## TC-R-025: Уведомления читателя — не авторизован

**US:** US-R13  
**Priority:** P0  
**Type:** Security  
**Estimated Time:** 1 мин

### Test Steps
1. Открыть `/notifications` без авторизации
   **Expected:** Редирект на `/login`

---

## TC-R-GUIDE-001: Открытие руководства читателя

**US:** US-R1  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Авторизован как `reader`

### Test Steps
1. На главной странице или в разделе `/bookmarks` / `/notifications` найти ссылку/кнопку «Руководство»
   **Expected:** Модальное окно или страница с руководством для читателей открывается; контент описывает функции: закладки, голосование, подписки, комментарии
