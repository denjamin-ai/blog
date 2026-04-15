# Test Cases: UI/UX (Responsive + Accessibility)

**Покрытие:** Фазы 20–24 (UI-рефакторинг, responsive, accessibility)  
**Предусловие для всех кейсов:** dev-сервер запущен (`npm run dev`), браузер Chrome latest.

---

## TC-UI-001: Skip-to-content ссылка

**Priority:** P0  
**Type:** Accessibility  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Страница `/` загружена

### Test Steps
1. Нажать Tab один раз
   **Expected:** Появляется видимая ссылка «Перейти к содержимому» в левом верхнем углу

2. Нажать Enter
   **Expected:** Фокус перемещается на элемент `<main id="main-content">`; страница прокручивается к началу контента

3. Повторить на страницах `/blog`, `/admin` (авторизовавшись)
   **Expected:** Ссылка работает одинаково на всех страницах

### Post-conditions
- Нет изменений в БД

---

## TC-UI-002: Тема dark/light — переключение

**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Страница `/` загружена

### Test Steps
1. Нажать кнопку переключения темы
   **Expected:** Тема меняется (dark ↔ light); все текстовые элементы остаются читаемыми; нет белых «вспышек»

2. Перейти на `/blog/[slug]` (страница статьи)
   **Expected:** MDX-контент, code-блоки, TOC корректно отображаются в текущей теме

3. Обновить страницу (F5)
   **Expected:** Выбранная тема сохраняется после перезагрузки

### Post-conditions
- Нет изменений в БД

---

## TC-UI-003: Mobile nav (375px)

**Priority:** P0  
**Type:** Responsive  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Viewport установлен на 375×667 (iPhone SE)

### Test Steps
1. Открыть `/`
   **Expected:** Навигация свёрнута; видна кнопка-гамбургер с `aria-expanded="false"`

2. Нажать кнопку-гамбургер
   **Expected:** Меню раскрывается; `aria-expanded="true"`; все пункты меню видны и кликабельны

3. Нажать на пункт меню «Блог»
   **Expected:** Переход на `/blog`; меню закрывается

4. Нажать Escape (если меню открыто)
   **Expected:** Меню закрывается

### Post-conditions
- Нет изменений в БД

---

## TC-UI-004: Mobile карточки статей (375px)

**Priority:** P1  
**Type:** Responsive  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Viewport 375×667
- [ ] Есть ≥ 2 опубликованных статьи

### Test Steps
1. Открыть `/blog`
   **Expected:** Карточки статей отображаются в одну колонку; текст не обрезан; карточки не выходят за пределы экрана

2. Проскроллить список
   **Expected:** Нет горизонтального скролла страницы

### Post-conditions
- Нет изменений в БД

---

## TC-UI-005: Mobile TOC (375px)

**Priority:** P1  
**Type:** Responsive  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Viewport 375×667
- [ ] Есть опубликованная статья с ≥ 3 заголовками

### Test Steps
1. Открыть `/blog/[slug]`
   **Expected:** TOC отображается в компактном формате (не sticky sidebar); контент статьи не обрезан

2. Нажать на элемент TOC
   **Expected:** Страница прокручивается к соответствующему заголовку

### Post-conditions
- Нет изменений в БД

---

## TC-UI-006: Mobile split-pane ревью (375px)

**Priority:** P1  
**Type:** Responsive  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Viewport 375×667
- [ ] Авторизован как reviewer
- [ ] Есть активное назначение ревью

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Панель статьи и панель комментариев расположены вертикально (stack); нет горизонтального скролла

2. Переключиться между вкладками «Статья» / «Diff»
   **Expected:** Контент переключается корректно

3. Прокрутить до панели комментариев
   **Expected:** Комментарии читаемы; форма ввода видна полностью

### Post-conditions
- Нет изменений в БД

---

## TC-UI-007: Mobile таблицы admin (375px)

**Priority:** P0  
**Type:** Responsive  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Viewport 375×667
- [ ] Авторизован как admin

### Test Steps
1. Открыть `/admin/articles`
   **Expected:** Таблица прокручивается горизонтально (overflow-x-auto); содержимое не обрезано и не выходит за пределы экрана

2. Открыть `/admin/users`
   **Expected:** Аналогично — горизонтальный скролл работает

### Post-conditions
- Нет изменений в БД

---

## TC-UI-008: Focus-visible

**Priority:** P0  
**Type:** Accessibility  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Страница `/` загружена

### Test Steps
1. Нажимать Tab для перехода между интерактивными элементами (ссылки, кнопки)
   **Expected:** Каждый элемент получает видимое кольцо фокуса (outline 2px accent-цвет с offset 2px)

2. Кликнуть мышкой на кнопку/ссылку
   **Expected:** Кольцо фокуса НЕ появляется при клике мышкой

3. Проверить на странице `/blog/[slug]` — ссылки в статье, кнопка копирования кода, кнопка темы
   **Expected:** Все элементы имеют одинаковый стиль focus-visible

### Post-conditions
- Нет изменений в БД

---

## TC-UI-009: Reduced motion

**Priority:** P2  
**Type:** Accessibility  
**Estimated Time:** 2 мин

### Preconditions
- [ ] В настройках ОС/браузера включён режим `prefers-reduced-motion: reduce`

### Test Steps
1. Открыть `/`
   **Expected:** Нет анимаций появления элементов (fade-in, slide-up)

2. Переключить тему
   **Expected:** Иконка темы меняется без анимации вращения

3. Открыть `/blog`, навести на карточку статьи
   **Expected:** Нет анимации hover (transform/scale)

### Post-conditions
- Нет изменений в БД

---

## TC-UI-010: Aria-labels на icon-only кнопках

**Priority:** P1  
**Type:** Accessibility  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как reader
- [ ] Есть опубликованная статья

### Test Steps
1. Открыть `/blog/[slug]`, проверить кнопку переключения темы через DevTools
   **Expected:** `aria-label` содержит текст на русском («Переключить на светлую тему» или «Переключить на тёмную тему»)

2. Проверить кнопки голосования (↑ / ↓)
   **Expected:** `aria-label="Нравится"` и `aria-label="Не нравится"` (или «Войдите, чтобы голосовать» для неавторизованных)

3. Проверить кнопку закладки
   **Expected:** `aria-label="В закладки"` или `aria-label="Убрать из закладок"` в зависимости от состояния

4. Проверить кнопку копирования кода (code block)
   **Expected:** `aria-label="Копировать код"`

### Post-conditions
- Нет изменений в БД

---

## TC-UI-011: Page load анимации (desktop)

**Priority:** P2  
**Type:** Visual  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Viewport ≥ 1024px
- [ ] `prefers-reduced-motion` НЕ включён

### Test Steps
1. Открыть `/` (hard reload Ctrl+Shift+R)
   **Expected:** Элементы hero-секции появляются с анимацией (fade-in / slide-up)

2. Открыть `/blog`
   **Expected:** Карточки статей появляются с последовательной анимацией (stagger)

### Post-conditions
- Нет изменений в БД

---

## TC-UI-012: Scroll progress bar

**Priority:** P2  
**Type:** Visual  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Есть опубликованная длинная статья

### Test Steps
1. Открыть `/blog/[slug]`
   **Expected:** Вверху страницы видна полоска прогресса чтения (0% в начале)

2. Прокрутить страницу вниз
   **Expected:** Полоска заполняется пропорционально прокрутке

3. Прокрутить до конца статьи
   **Expected:** Полоска заполнена на 100%

### Post-conditions
- Нет изменений в БД

---

## TC-UI-013: Empty states

**Priority:** P1  
**Type:** Visual  
**Estimated Time:** 3 мин

### Preconditions
- [ ] Авторизован как автор без статей (или новый аккаунт)

### Test Steps
1. Открыть `/author/articles`
   **Expected:** Отображается информативное пустое состояние (не пустая страница), текст «Статей пока нет» или аналог

2. Открыть `/bookmarks` (авторизован как reader без закладок)
   **Expected:** Пустое состояние с текстом

3. Открыть `/blog` при отсутствии опубликованных статей
   **Expected:** Пустое состояние с текстом

### Post-conditions
- Нет изменений в БД

---

## TC-UI-014: Hover states

**Priority:** P1  
**Type:** Visual  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Viewport ≥ 1024px (desktop)

### Test Steps
1. На `/blog` навести курсор на карточку статьи
   **Expected:** Видимое изменение стиля (цвет, тень или transform)

2. Навести на ссылки в навигации
   **Expected:** Цвет ссылки меняется

3. Навести на кнопки (голосование, закладка, тема)
   **Expected:** Кнопки реагируют на hover (изменение фона или цвета)

### Post-conditions
- Нет изменений в БД

---

## TC-UI-015: Cover image в карточках

**Priority:** P1  
**Type:** Visual  
**Estimated Time:** 2 мин

### Preconditions
- [ ] Есть ≥ 1 статья с обложкой (`coverImageUrl`)
- [ ] Есть ≥ 1 статья без обложки

### Test Steps
1. Открыть `/blog`
   **Expected:** Карточка с обложкой показывает изображение; `alt` содержит заголовок статьи

2. Проверить карточку без обложки
   **Expected:** Карточка выглядит корректно (нет сломанного изображения или пустого пространства)

3. Открыть `/blog/[slug]` для статьи с обложкой
   **Expected:** Обложка отображается на странице статьи с корректным `alt`

### Post-conditions
- Нет изменений в БД
