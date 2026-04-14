# Test Cases: ГОСТЬ (Unauthenticated)

**Покрытие:** US-G1..G9  
**Предусловие для всех кейсов:** пользователь не авторизован, куки сессии очищены.

---

## TC-G-001: Главная страница — успешная загрузка

**US:** US-G1  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Профиль блога заполнен (name, bio, avatarUrl)
- [ ] Есть ≥ 3 опубликованные статьи

### Test Steps
1. Открыть `http://localhost:3000/`
   **Expected:** Страница загружается (HTTP 200), видны аватар, имя и bio автора

2. Проверить секцию «Последние статьи»
   **Expected:** Отображаются ровно 3 последних опубликованных статьи (карточки с заголовком, описанием, датой)

3. Нажать кнопку «Все статьи»
   **Expected:** Переход на `/blog`

### Post-conditions
- Нет изменений в БД

---

## TC-G-002: Главная страница — пустой профиль

**US:** US-G1  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Профиль блога не заполнен (name, bio, avatarUrl = null)

### Test Steps
1. Открыть `http://localhost:3000/`
   **Expected:** Страница рендерится без 500; пустые поля отображаются без ошибок (например, пустая строка или placeholder)

---

## TC-G-003: Список статей — просмотр и переход

**US:** US-G2  
**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Есть ≥ 2 опубликованные статьи

### Test Steps
1. Открыть `/blog`
   **Expected:** Список карточек статей; каждая карточка содержит заголовок, описание, теги, дату, бейдж сложности (если задан)

2. Кликнуть на карточку статьи
   **Expected:** Переход на `/blog/[slug]`, страница загружается (HTTP 200)

3. Проверить содержимое страницы статьи
   **Expected:** Заголовок, MDX-контент, теги; нет ошибки рендера

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Статья `draft` | Не отображается в списке |
| Статья `scheduled` | Не отображается в списке |
| Статья `published`, автор `isBlocked=1` | Не отображается в списке и 404 при прямом переходе |

---

## TC-G-004: Страница статьи — 404 при несуществующем slug

**US:** US-G2  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/blog/non-existent-slug-12345`
   **Expected:** HTTP 404, отображается страница «Не найдено»

---

## TC-G-005: Changelog статьи — отображение записей

**US:** US-G3  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья опубликована, есть ≥ 1 запись в `articleChangelog`

### Test Steps
1. Открыть `/blog/[slug]`
   **Expected:** Внизу страницы (или в выделенной секции) виден компонент `ArticleChangelog`

2. Развернуть/проверить changelog
   **Expected:** Каждая запись содержит дату, секцию (если есть), описание изменений

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Записей нет | Компонент `ArticleChangelog` не отображается |

---

## TC-G-006: Копирование кода из статьи

**US:** US-G4  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Статья содержит блок кода (````js ... ```` в MDX)

### Test Steps
1. Открыть страницу статьи с блоком кода
   **Expected:** Иконка копирования видна в правом верхнем углу блока кода (`[data-rehype-pretty-code-figure]`)

2. Нажать иконку копирования
   **Expected:** Иконка меняется на «✓» (или аналог); код доступен в буфере обмена (`Ctrl+V` в тестовом поле)

---

## TC-G-007: Публичные комментарии — отображение

**US:** US-G5  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 5 мин

### Preconditions
- [ ] Статья опубликована, есть ≥ 3 комментария (один — с дочерним ответом, один — удалённый)

### Test Steps
1. Открыть `/blog/[slug]`, прокрутить до секции комментариев
   **Expected:** Дерево комментариев; корневые + дочерние (с отступом); отображается имя автора и дата

2. Проверить удалённый комментарий
   **Expected:** Текст «[удалено]» вместо содержимого; дочерние ответы сохраняются

3. Если комментариев > лимита — проверить пагинацию
   **Expected:** Кнопка «Загрузить ещё» загружает следующую порцию

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Комментариев нет | Секция комментариев пуста или скрыта |

---

## TC-G-008: Перенаправление на логин для комментирования

**US:** US-G6  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/blog/[slug]`, найти ссылку «Войдите, чтобы оставить комментарий»
   **Expected:** Ссылка присутствует (неавторизованный пользователь не видит форму ввода)

2. Кликнуть ссылку
   **Expected:** Переход на `/login`

---

## TC-G-009: Переключение темы

**US:** US-G7  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть главную страницу, найти `ThemeToggle` в шапке
   **Expected:** Кнопка видна

2. Кликнуть кнопку переключения темы
   **Expected:** Тема меняется (light → dark или dark → light); изменение визуально заметно

3. Перезагрузить страницу
   **Expected:** Тема сохранена (localStorage `theme`)

---

## TC-G-010: Публичный профиль автора — успешный переход

**US:** US-G8  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Пользователь с ролью `author`, заполненным `slug`, `displayName`, `bio`, `avatarUrl`
- [ ] У автора есть ≥ 1 опубликованная статья

### Test Steps
1. Открыть `/authors/[slug]`
   **Expected:** HTTP 200; отображается `displayName`, `bio`, аватар, ссылки (GitHub/Telegram/сайт, если заданы)

2. Проверить список статей автора
   **Expected:** Только опубликованные статьи; каждая карточка кликабельна

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| `slug` не найден | HTTP 404 |
| Автор `isBlocked=1` | 404 или статьи не отображаются |
| `slug` не задан у автора | Страница `/authors/null` → 404 |

---

## TC-G-011: Публичный профиль автора — ссылки в профиле

**US:** US-G8  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Автор заполнил ссылки: GitHub, Telegram, сайт

### Test Steps
1. Открыть `/authors/[slug]`
   **Expected:** Ссылки отображаются; у `target="_blank"` есть `rel="noopener noreferrer"`

---

## TC-G-012: RSS-лента

**US:** US-G9  
**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Есть ≥ 2 опубликованные статьи

### Test Steps
1. Открыть `/feed.xml`
   **Expected:** HTTP 200; Content-Type `application/rss+xml` (или `text/xml`)

2. Проверить структуру XML
   **Expected:** Валидный RSS 2.0: теги `<channel>`, `<title>`, `<item>` для каждой статьи

3. Проверить наличие `<dc:creator>` у статей с автором
   **Expected:** Имя автора присутствует

4. Проверить заголовок `Cache-Control`
   **Expected:** `max-age=3600`

### Edge Cases
| Сценарий | Expected |
|----------|----------|
| Статей нет | Возвращается пустой `<channel>` без `<item>` |
| Статья `draft` | Не включается в RSS |

---

## TC-G-013: Sitemap

**US:** US-G8 (смежно)  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 2 мин

### Test Steps
1. Открыть `/sitemap.xml`
   **Expected:** HTTP 200; список URL включает `/`, `/blog`, slug всех опубликованных статей, `/authors/[slug]` авторов с ненулевым slug

---

## TC-G-014: VersionWarning для читателя

**US:** US-G5 (смежно с US-R6)  
**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 4 мин

### Preconditions
- [ ] Статья отредактирована (создана новая `articleVersion`), читатель оставил комментарий к старой версии

### Test Steps
1. Открыть `/blog/[slug]` как гость
   **Expected:** Рядом с комментарием, привязанным к старой версии, виден компонент `VersionWarning` с датой той версии
