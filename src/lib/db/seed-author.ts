/**
 * Одноразовый скрипт: удаляет admin-статьи, создаёт тестового автора и его статью.
 * Запуск: npx tsx src/lib/db/seed-author.ts
 */
import { db } from "./index";
import { articles, users } from "./schema";
import { isNull, eq } from "drizzle-orm";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";

const now = Math.floor(Date.now() / 1000);

async function run() {
  // 1. Удалить все статьи администратора (authorId IS NULL)
  const deleted = await db
    .delete(articles)
    .where(isNull(articles.authorId))
    .returning({ id: articles.id });
  console.log(`Удалено ${deleted.length} admin-статей`);

  // 2. Создать тестового автора (если ещё нет)
  const existingAuthor = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, "testauthor"))
    .get();

  let authorId: string;
  if (existingAuthor) {
    authorId = existingAuthor.id;
    console.log("Автор testauthor уже существует, пропускаем создание");
  } else {
    authorId = ulid();
    const passwordHash = await bcrypt.hash("author123", 10);
    await db.insert(users).values({
      id: authorId,
      username: "testauthor",
      name: "Test Author",
      role: "author",
      passwordHash,
      displayName: "Test Author",
      bio: "Тестовый автор блога. Пишу о TypeScript, Next.js и веб-разработке.",
      slug: "testauthor",
      createdAt: now,
      updatedAt: now,
    });
    console.log("Создан автор: testauthor / author123");
  }

  // 3. Создать тестовую статью для автора
  const articleSlug = "intro-nextjs-app-router";
  const existingArticle = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, articleSlug))
    .get();

  if (existingArticle) {
    console.log(`Статья "${articleSlug}" уже существует, пропускаем`);
  } else {
    await db.insert(articles).values({
      id: ulid(),
      slug: articleSlug,
      title: "Next.js App Router: практическое руководство",
      content: `Next.js 13+ представил App Router — новый способ организации маршрутизации на основе файловой системы.

## Структура проекта

\`\`\`
app/
  layout.tsx      — корневой layout
  page.tsx        — главная страница /
  blog/
    page.tsx      — /blog
    [slug]/
      page.tsx    — /blog/:slug
\`\`\`

## Server Components по умолчанию

Все компоненты в \`app/\` — серверные по умолчанию. Они рендерятся на сервере и не попадают в бандл клиента:

\`\`\`typescript
// app/blog/page.tsx — Server Component
import { db } from "@/lib/db";

export default async function BlogPage() {
  const posts = await db.select().from(articles);
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
\`\`\`

## Client Components

Для интерактивности — директива \`"use client"\`:

\`\`\`typescript
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
\`\`\`

## Layouts и вложенность

Layouts оборачивают все дочерние страницы и сохраняют состояние при навигации.

App Router — мощный инструмент для построения современных React-приложений с отличной производительностью.`,
      excerpt:
        "Разбираем App Router в Next.js: Server Components, Client Components, layouts и вложенная маршрутизация.",
      tags: JSON.stringify(["next.js", "react", "app-router"]),
      status: "published",
      authorId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Статья "${articleSlug}" создана для автора ${authorId}`);
  }

  console.log("Готово.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
