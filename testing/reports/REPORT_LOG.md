# Report Log

Лог всех тест-прогонов блог-платформы.  
Формат каждой записи: дата, ссылка на полный отчёт, сводка, вердикт.

---

| Дата | Отчёт | Тип прогона | Прошли | Провалились | Отклонения | Вердикт | Краткая сводка |
|------|-------|-------------|--------|-------------|------------|---------|----------------|
| 2026-04-14 | [REPORT_1.md](REPORT_1.md) | Полный (MCP) | 149/170 | 12 | 4 | ❌ NO-GO | XSS BUG-006: `<script>` в MDX выполняется в браузере. Все P0/P1 роуты работают, auth OK. |
| 2026-04-14 | [REPORT_2.md](REPORT_2.md) | Полный (Playwright E2E) | 23/26 | 0 | 3 | ✅ GO | BUG-003/004/005 исправлены. 23 прошли, 3 пропущены (FormulaInserter, Live-preview, Vote — не имплементированы). Нет провалов. `npm run build` — OK. |
| 2026-04-15 | [REPORT_UI.md](REPORT_UI.md) | Smoke + UI (MCP) | 21/24 | 1 | 2 | ❌ NO-GO | P0: onClick в Server Component (article-card.tsx) → /blog 500. P2: skip-link focus. |
| 2026-04-15 | [REPORT_UX.md](REPORT_UX.md) | UX ревью (MCP) | 5/5 flows | 0 | 0 | ✅ PASS | P0 найден и исправлен: comments 500 (нет articleVersions). 5 flows пройдены. |
| 2026-04-15 | [REPORT_UI_FINAL.md](REPORT_UI_FINAL.md) | Smoke + UI повторный (MCP) | 21/21 | 0 | 0 | ✅ GO | Все фиксы подтверждены. 21/21 прошли. |

---

## Как добавить запись

После каждого прогона `playwright-tester` агент или CI создаёт файл `REPORT_<N>.md`  
и добавляет строку в эту таблицу:

```
| YYYY-MM-DD | [REPORT_N.md](REPORT_N.md) | Smoke/Targeted/Регресс | X/Y | Z | W | ✅/❌/⚠️ | Краткое описание |
```

### Типы прогонов

| Тип | Команда | Когда |
|-----|---------|-------|
| Smoke | `npx playwright test --grep @smoke` | Каждый деплой |
| E2E (авто) | `npx playwright test` | После PR |
| Полный (MCP) | playwright-tester агент | Перед релизом |

### Критерии вердикта

| Вердикт | Условие |
|---------|---------|
| ✅ GO | Все P0 прошли; ≥ 90% P1 прошли; нет открытых критических багов |
| ❌ NO-GO | Любой P0 провалился; security-уязвимость; data loss |
| ⚠️ CONDITIONAL | P1 провалы с workaround; нет P0 проблем |
