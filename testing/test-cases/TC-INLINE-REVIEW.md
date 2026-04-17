# Test Cases: Inline Review (Cross-Role)

**Покрытие:** Inline annotations, suggestions, batch review, keyboard navigation  
**Предусловие для всех кейсов:** Есть статья с назначением ревьюера в статусе `accepted`; сессия ревью активна.

---

## TC-IR-001: Выделение текста → popover → комментарий

**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин  
**Role:** Reviewer

### Preconditions
- [ ] Авторизован как reviewer
- [ ] Назначение в статусе `accepted`
- [ ] Статья содержит текстовый контент (≥ 3 абзаца)

### Test Steps
1. Открыть `/reviewer/assignments/[id]`
   **Expected:** Страница загружается; двухпанельный layout (article + sidebar)

2. Выделить фрагмент текста в панели статьи (3–10 слов)
   **Expected:** Появляется popover с кнопками «Комментарий» и «Предложение»

3. Нажать «Комментарий» → ввести текст → отправить
   **Expected:** Комментарий появляется в sidebar; текст подсвечен в панели статьи (highlight)

### Post-conditions
- Комментарий создан в `reviewComments` с `anchorType=text`, `anchorData` заполнен, `batchId` ≠ null

---

## TC-IR-002: Выделение текста → suggestion → apply

**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 5 мин  
**Roles:** Reviewer → Author/Admin

### Preconditions
- [ ] Reviewer создал suggestion через inline selection
- [ ] Авторизован как author (владелец статьи) или admin

### Test Steps
1. Reviewer: выделить текст → «Предложение» → ввести замену → отправить
   **Expected:** Suggestion появляется в sidebar с исходным и предложенным текстом

2. Reviewer: нажать «Отправить ревью» → выбрать вердикт → подтвердить
   **Expected:** Batch published; комментарии видны автору

3. Author/Admin: открыть ревью страницу → найти suggestion → «Применить»
   **Expected:** Текст в статье заменён; suggestion отмечен как applied; создана версия в `articleVersions`

### Post-conditions
- `reviewComments.appliedAt` ≠ null
- `articleVersions` содержит snapshot до изменения

---

## TC-IR-003: Suggestion apply на изменённый текст → 409/422

**Priority:** P0  
**Type:** Negative  
**Estimated Time:** 3 мин  
**Roles:** Reviewer → Author/Admin

### Preconditions
- [ ] Suggestion создан и опубликован
- [ ] Текст статьи изменён (исходная цитата больше не найдена)

### Test Steps
1. Author/Admin: нажать «Применить» на suggestion
   **Expected:** Ошибка 422 «Исходный текст не найден в статье»; статья не изменена

---

## TC-IR-004: Block comment на code block

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Reviewer

### Preconditions
- [ ] Статья содержит блок кода (```...```)

### Test Steps
1. Нажать кнопку block comment на блоке кода
   **Expected:** Комментарий привязан к блоку; `anchorType=block`; highlight отображается

---

## TC-IR-005: Block comment на KaTeX формулу

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Reviewer

### Preconditions
- [ ] Статья содержит LaTeX формулу ($$...$$)

### Test Steps
1. Нажать кнопку block comment на формуле
   **Expected:** Комментарий привязан к блоку; `anchorType=block`

---

## TC-IR-006: Block comment на Mermaid диаграмму

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Reviewer

### Preconditions
- [ ] Статья содержит Mermaid диаграмму

### Test Steps
1. Нажать кнопку block comment на диаграмме
   **Expected:** Комментарий привязан к блоку; `anchorType=block`

---

## TC-IR-007: Batch review — создать 3 комментария → отправить → автор видит все

**Priority:** P0  
**Type:** Functional  
**Estimated Time:** 7 мин  
**Roles:** Reviewer → Author

### Preconditions
- [ ] Reviewer в accepted assignment

### Test Steps
1. Reviewer: создать 3 inline комментария (не отправляя ревью)
   **Expected:** Batch bar внизу показывает «3 замечания в черновике»

2. Reviewer: нажать «Отправить ревью» → выбрать `needs_work` → подтвердить
   **Expected:** Все 3 комментария опубликованы; assignment → `completed`

3. Author: открыть ревью страницу
   **Expected:** Все 3 комментария видны с highlight в панели статьи

### Post-conditions
- `reviewComments.batchId` = null для всех 3 комментариев (published)
- `reviewAssignments.status` = `completed`, `verdict` = `needs_work`

---

## TC-IR-008: Batch pending — автор НЕ видит pending

**Priority:** P0  
**Type:** Security  
**Estimated Time:** 5 мин  
**Roles:** Reviewer + Author

### Preconditions
- [ ] Reviewer создал 2 inline комментария (не отправил ревью)

### Test Steps
1. Author: открыть ревью страницу для этого assignment
   **Expected:** 0 комментариев видно (pending batch скрыт)

2. Author: вызвать `GET /api/assignments/[id]/review-comments`
   **Expected:** Ответ не содержит комментариев с `batchId` ≠ null от ревьюера

---

## TC-IR-009: Keyboard N/P/R/E/⌘↵

**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 5 мин  
**Role:** Reviewer

### Preconditions
- [ ] Есть ≥ 3 опубликованных комментария (2 unresolved, 1 resolved)

### Test Steps
1. Нажать `N` → next unresolved thread
   **Expected:** Sidebar прокручивается к следующему нерезолвленному; highlight мигает

2. Нажать `P` → previous unresolved
   **Expected:** Sidebar прокручивается назад

3. Нажать `R` → resolve active thread
   **Expected:** Комментарий отмечен как resolved

4. Нажать `E` → focus reply input
   **Expected:** Курсор в текстовом поле ответа

5. В textarea нажать `⌘↵` или `Ctrl+Enter` → submit reply
   **Expected:** Ответ отправлен

---

## TC-IR-010: Orphan → «Текст изменён»

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Roles:** Reviewer → Author/Admin

### Preconditions
- [ ] Reviewer оставил inline comment, привязанный к определённому тексту
- [ ] Author/Admin изменил этот фрагмент статьи

### Test Steps
1. Открыть ревью страницу
   **Expected:** Комментарий отображается с индикатором «Текст изменён» (orphan marker); highlight отсутствует или визуально отличается

---

## TC-IR-011: Suggestion XSS — `<script>...` → stripped

**Priority:** P0  
**Type:** Security  
**Estimated Time:** 3 мин  
**Roles:** Reviewer → Author

### Preconditions
- [ ] Reviewer создал suggestion с `suggestionText: '<script>alert("xss")</script>Чистый текст'`

### Test Steps
1. Author: применить suggestion
   **Expected:** В статье только «Чистый текст»; тег `<script>` удалён

2. Проверить `article.content` в БД
   **Expected:** Нет `<script>`, `onerror=`, `javascript:` в сохранённом контенте

---

## TC-IR-012: Diff overlay + annotations одновременно

**Priority:** P2  
**Type:** Functional  
**Estimated Time:** 5 мин  
**Role:** Reviewer

### Preconditions
- [ ] Статья изменена после назначения (есть diff)
- [ ] Есть ≥ 1 inline comment с highlight

### Test Steps
1. Включить «Показать изменения» (toggle diff overlay)
   **Expected:** Diff отображается (добавления/удаления); inline highlights по-прежнему видны поверх diff

2. Выключить diff overlay
   **Expected:** Только inline highlights остаются

---

## TC-IR-013: Author resolve inline comment

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Author

### Preconditions
- [ ] Ревью завершено с вердиктом `needs_work`
- [ ] Есть unresolved inline comment

### Test Steps
1. Author: нажать «Resolve» на комментарии
   **Expected:** Комментарий отмечен как resolved; `resolvedAt` ≠ null; `resolvedBy` = author userId

---

## TC-IR-014: Author reply to inline comment

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Author

### Preconditions
- [ ] Ревью завершено; есть inline comment от ревьюера

### Test Steps
1. Author: написать ответ на inline comment
   **Expected:** Ответ появляется в треде; reviewer получает уведомление

---

## TC-IR-015: Admin apply suggestion на чужую статью

**Priority:** P1  
**Type:** Functional  
**Estimated Time:** 3 мин  
**Role:** Admin

### Preconditions
- [ ] Suggestion создан ревьюером на статью автора (не admin)

### Test Steps
1. Admin: применить suggestion
   **Expected:** Текст в статье заменён; версия создана; `appliedAt` установлен

---

## Чеклист выполнения

| Тест | Статус | Комментарий |
|------|--------|-------------|
| TC-IR-001 | ☐ | |
| TC-IR-002 | ☐ | |
| TC-IR-003 | ☐ | |
| TC-IR-004 | ☐ | |
| TC-IR-005 | ☐ | |
| TC-IR-006 | ☐ | |
| TC-IR-007 | ☐ | |
| TC-IR-008 | ☐ | |
| TC-IR-009 | ☐ | |
| TC-IR-010 | ☐ | |
| TC-IR-011 | ☐ | |
| TC-IR-012 | ☐ | |
| TC-IR-013 | ☐ | |
| TC-IR-014 | ☐ | |
| TC-IR-015 | ☐ | |

**Итог:** ___/15 прошли  
**Тестировщик:** ________________  
**Дата:** ________________  
**Решение:** ✅ GO / ❌ NO-GO
