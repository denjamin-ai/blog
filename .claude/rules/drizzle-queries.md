---
description: Паттерны Drizzle ORM
paths: ["src/lib/db/**", "src/app/api/**"]
---
- Только Drizzle — никакого raw SQL
- Timestamps в Unix seconds: `Math.floor(Date.now() / 1000)`
- ID через `ulid()`
- JSON-строки: `JSON.parse()` с try-catch
- Обновление статьи: сначала снимок в articleVersions
- Проверка уникальности slug при создании и обновлении
- dialect в drizzle.config.ts: "turso", не "sqlite"