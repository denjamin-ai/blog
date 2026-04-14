---
name: code-review
description: Ревью изменённых файлов по безопасности, типам, стилю, UX
context: fork
---
Ревью файлов из `git diff --name-only HEAD`:

1. **Безопасность** (P0): XSS, инъекции, утечки секретов, обход auth
2. **Типы и edge-cases** (P1): null-проверки, типы, необработанные ошибки
3. **Паттерны** (P2): JSON.parse без try-catch, raw SQL, timestamps не в Unix seconds
4. **Стиль** (P2): несоответствие конвенциям из CLAUDE.md
5. **UX** (P3): loading states, ошибки, доступность

Формат: [P0/P1/P2/P3] Файл:строка — Проблема — Фикс