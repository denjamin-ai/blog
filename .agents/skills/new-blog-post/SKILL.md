---
name: new-blog-post
description: Создаёт новый MDX-пост с frontmatter и правильной структурой
argument-hint: [название-поста]
disable-model-invocation: true
---
Создай новый блог-пост с названием "$ARGUMENTS".

1. Сгенерируй URL-safe slug (транслитерация для кириллицы)
2. Сгенерируй ULID для id
3. Вставь запись в таблицу articles через Drizzle:
   - title, slug, content (шаблон MDX), description ("")
   - tags: "[]", published: false
   - createdAt/updatedAt: Math.floor(Date.now() / 1000)
4. Покажи ссылки: /blog/{slug} и /admin/articles/{id}

Паттерны: src/lib/db/schema.ts и src/app/api/articles/route.ts.