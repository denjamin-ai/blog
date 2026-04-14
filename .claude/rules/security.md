---
description: Правила безопасности — активны для всех файлов
---
- Секреты только через process.env, без fallback-значений
- Все admin API-роуты начинаются с `await requireAdmin()`
- bcrypt-хеши в .env.local: `\$2b\$10\$...`
- JSON.parse всегда в try-catch
- target="_blank" с rel="noopener noreferrer"
- Не логируй req.body целиком