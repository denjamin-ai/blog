# Smoke Test Suite

**Цель:** Быстрая проверка критических путей перед/после каждого деплоя  
**Время выполнения:** ~21 мин  
**Частота:** Каждый деплой  
**Критерий провала:** Любой тест не прошёл → стоп, фиксим билд

---

## Критерии прохода/провала

**PASS:** Все 20 тестов прошли  
**FAIL (стоп деплоя):** Любой тест провалился

---

## SMOKE-001: Публичная главная страница доступна

**Priority:** P0 | **Time:** 1 мин

1. Открыть `http://localhost:3000/` без авторизации
   **Expected:** HTTP 200; страница рендерится; нет JS-ошибок в консоли

---

## SMOKE-002: Список статей доступен

**Priority:** P0 | **Time:** 1 мин

1. Открыть `/blog`
   **Expected:** HTTP 200; список карточек отображается

---

## SMOKE-003: Страница статьи открывается

**Priority:** P0 | **Time:** 1 мин

### Preconditions
- [ ] Есть ≥ 1 опубликованная статья

1. Открыть `/blog/[известный_slug]`
   **Expected:** HTTP 200; заголовок и контент статьи видны

---

## SMOKE-004: Вход читателя

**Priority:** P0 | **Time:** 2 мин

1. Открыть `/login`, ввести `reader` / `password`
   **Expected:** Редирект на `/`; сессия установлена (`role=reader`)

---

## SMOKE-005: Вход автора

**Priority:** P0 | **Time:** 2 мин

1. Открыть `/login`, ввести `author` / `password`
   **Expected:** Редирект на `/author`

---

## SMOKE-006: Вход ревьюера

**Priority:** P0 | **Time:** 2 мин

1. Открыть `/login`, ввести `reviewer` / `password`
   **Expected:** Редирект на `/reviewer`

---

## SMOKE-007: Вход администратора

**Priority:** P0 | **Time:** 2 мин

1. Открыть `/admin/login`, ввести пароль администратора
   **Expected:** Редирект на `/admin`

---

## SMOKE-008: Защищённые роуты — без авторизации

**Priority:** P0 | **Time:** 2 мин

1. Открыть `/admin` без сессии
   **Expected:** Редирект на `/admin/login`

2. Открыть `/author` без сессии
   **Expected:** Редирект на `/login`

3. Открыть `/reviewer` без сессии
   **Expected:** Редирект на `/login`

---

## SMOKE-009: Выход из системы

**Priority:** P0 | **Time:** 1 мин

### Preconditions
- [ ] Авторизован как `author`

1. Нажать «Выйти»
   **Expected:** Сессия очищена; `/author` → редирект на `/login`

---

## SMOKE-010: API статей отвечает

**Priority:** P0 | **Time:** 1 мин

1. `GET /api/articles?status=published`
   **Expected:** HTTP 200; валидный JSON с массивом статей

---

## SMOKE-011: RSS-лента доступна

**Priority:** P0 | **Time:** 1 мин

1. Открыть `/feed.xml`
   **Expected:** HTTP 200; Content-Type содержит `xml`; тег `<rss>` присутствует

---

## SMOKE-012: Создание черновика (author)

**Priority:** P0 | **Time:** 3 мин

### Preconditions
- [ ] Авторизован как `author`

1. `POST /api/articles` с `{ title: "Smoke Test Article", slug: "smoke-test-[timestamp]", status: "draft" }`
   **Expected:** HTTP 201; статья создана

2. Удалить тестовую статью после проверки

---

## SMOKE-014: Уведомления API

**Priority:** P0 | **Time:** 1 мин

### Preconditions
- [ ] Авторизован как `author` или `reviewer`

1. `GET /api/notifications?unread=1`
   **Expected:** HTTP 200; валидный JSON

---

## SMOKE-015: Sitemap доступен

**Priority:** P1 | **Time:** 1 мин

1. Открыть `/sitemap.xml`
   **Expected:** HTTP 200; XML с тегами `<url>` для публичных страниц

---

## SMOKE-016: Skip-to-content ссылка

**Priority:** P0 | **Time:** 1 мин

1. Открыть `/`, нажать Tab
   **Expected:** Появляется видимая ссылка «Перейти к содержимому»; нажать Enter — фокус перемещается к `<main>`

---

## SMOKE-017: Focus-visible ring

**Priority:** P0 | **Time:** 1 мин

1. На любой странице нажать Tab несколько раз
   **Expected:** Каждый интерактивный элемент (ссылки, кнопки) получает видимое кольцо фокуса (outline accent-цвет)

---

## SMOKE-018: Admin таблица — горизонтальный скролл

**Priority:** P0 | **Time:** 1 мин

### Preconditions
- [ ] Авторизован как admin

1. Открыть `/admin/articles` на viewport 768px
   **Expected:** Таблица прокручивается горизонтально без обрезки контента

---

## SMOKE-REVIEW-001: Создание сессии ревью с 2 ревьюерами (admin)

**Priority:** P0 | **Time:** 3 мин

### Preconditions
- [ ] Авторизован как admin; есть статья в `draft`; есть ≥ 2 пользователя с ролью `reviewer`

1. На `/admin/articles/[id]` → «Отправить на ревью» → выбрать ревьюера #1
   **Expected:** `reviewAssignment #1` создан; уведомление отправлено

2. Повторить для ревьюера #2
   **Expected:** `reviewAssignment #2` создан; на странице `/admin/articles/[id]/review` видны 2 карточки

---

## SMOKE-CHAT-001: Написать сообщение в общий чат сессии

**Priority:** P0 | **Time:** 2 мин

### Preconditions
- [ ] Есть назначение в статусе `accepted`; авторизован как reviewer

1. Открыть `/reviewer/assignments/[id]` → ввести текст в форму чата → «Отправить»
   **Expected:** Сообщение появляется в треде; HTTP 200

---

## SMOKE-GUIDE-001: Открытие руководства (любая роль)

**Priority:** P0 | **Time:** 1 мин

1. Авторизоваться как любой пользователь (author, reviewer, reader) → найти кнопку «Руководство»
   **Expected:** Руководство открывается без ошибок; HTTP 200 на странице/модале

---

## Чеклист выполнения

| Тест | Статус | Комментарий |
|------|--------|-------------|
| SMOKE-001 | ☐ | |
| SMOKE-002 | ☐ | |
| SMOKE-003 | ☐ | |
| SMOKE-004 | ☐ | |
| SMOKE-005 | ☐ | |
| SMOKE-006 | ☐ | |
| SMOKE-007 | ☐ | |
| SMOKE-008 | ☐ | |
| SMOKE-009 | ☐ | |
| SMOKE-010 | ☐ | |
| SMOKE-011 | ☐ | |
| SMOKE-012 | ☐ | |
| SMOKE-014 | ☐ | |
| SMOKE-015 | ☐ | |
| SMOKE-016 | ☐ | |
| SMOKE-017 | ☐ | |
| SMOKE-018 | ☐ | |
| SMOKE-REVIEW-001 | ☐ | |
| SMOKE-CHAT-001 | ☐ | |
| SMOKE-GUIDE-001 | ☐ | |

**Итог:** ___/20 прошли  
**Тестировщик:** ________________  
**Дата:** ________________  
**Версия/Билд:** ________________  
**Решение:** ✅ GO / ❌ NO-GO
