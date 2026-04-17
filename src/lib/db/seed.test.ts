/**
 * seed.test.ts — тестовый seed для стенда тестирования
 *
 * Создаёт фиксированное начальное состояние:
 *   - profile "main"
 *   - 3 опубликованные статьи (2 от admin, 1 от автора)
 *   - reader  / password  (role: reader)
 *   - author  / password  (role: author)
 *   - reviewer / password (role: reviewer)
 *
 * Используется командой: npm run seed:test
 * БД указывается через TURSO_CONNECTION_URL (reset-test-db.sh выставляет file:blog.test.db)
 */

import { db } from "./index";
import { profile, articles, users } from "./schema";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";

const now = Math.floor(Date.now() / 1000);

// Фиксированные ID для idempotent-сида (повторный запуск не дублирует данные)
const AUTHOR_ID = "01TEST0000AUTHORUSER0001";
const READER_ID = "01TEST0000READERUSER0001";
const REVIEWER_ID = "01TEST0000REVIEWERUSER01";
const REVIEWER2_ID = "01TEST0000REVIEWERUSER02";

async function seed() {
  // ── Profile ──────────────────────────────────────────────────────────────
  await db
    .insert(profile)
    .values({
      id: "main",
      name: "Denjamin",
      bio: "Разработчик. Пишу о коде, инструментах и процессах разработки.",
      avatarUrl: null,
      links: JSON.stringify({
        github: "https://github.com/denjamin",
        email: "hello@example.com",
      }),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profile.id,
      set: {
        name: "Denjamin",
        bio: "Разработчик. Пишу о коде, инструментах и процессах разработки.",
        links: JSON.stringify({
          github: "https://github.com/denjamin",
          email: "hello@example.com",
        }),
        updatedAt: now,
      },
    });

  console.log("✅ Profile seeded");

  // ── Тестовые пользователи ─────────────────────────────────────────────────
  const PASSWORD_HASH = await bcrypt.hash("password", 10);

  await db
    .insert(users)
    .values({
      id: READER_ID,
      username: "reader",
      name: "Тестовый читатель",
      role: "reader",
      passwordHash: PASSWORD_HASH,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { name: "Тестовый читатель", updatedAt: now },
    });

  await db
    .insert(users)
    .values({
      id: AUTHOR_ID,
      username: "author",
      name: "Тестовый автор",
      role: "author",
      passwordHash: PASSWORD_HASH,
      displayName: "Тестовый Автор",
      bio: "Тестовый аккаунт автора для E2E-тестирования.",
      slug: "test-author",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: {
        name: "Тестовый автор",
        displayName: "Тестовый Автор",
        bio: "Тестовый аккаунт автора для E2E-тестирования.",
        slug: "test-author",
        updatedAt: now,
      },
    });

  await db
    .insert(users)
    .values({
      id: REVIEWER_ID,
      username: "reviewer",
      name: "Тестовый ревьюер",
      role: "reviewer",
      passwordHash: PASSWORD_HASH,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { name: "Тестовый ревьюер", updatedAt: now },
    });

  await db
    .insert(users)
    .values({
      id: REVIEWER2_ID,
      username: "reviewer2",
      name: "Второй ревьюер",
      role: "reviewer",
      passwordHash: PASSWORD_HASH,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { name: "Второй ревьюер", updatedAt: now },
    });

  console.log(
    "✅ Users seeded (reader / author / reviewer / reviewer2 — пароль: password)",
  );

  // ── Статьи ────────────────────────────────────────────────────────────────

  // Статья 1 — от admin (authorId = null)
  await db
    .insert(articles)
    .values({
      id: ulid(),
      slug: "typescript-utility-types",
      title: "Полезные utility-типы в TypeScript",
      content: `TypeScript предоставляет набор встроенных utility-типов, которые упрощают работу с типами.

## Pick и Omit

\`Pick\` позволяет выбрать только нужные свойства из типа:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }
\`\`\`

\`Omit\` — обратная операция, исключает свойства:

\`\`\`typescript
type UserWithoutRole = Omit<User, "role">;
// { id: number; name: string; email: string }
\`\`\`

## Partial и Required

\`Partial\` делает все свойства опциональными — удобно для функций обновления:

\`\`\`typescript
function updateUser(id: number, data: Partial<User>) {
  // data может содержать любое подмножество полей User
}

updateUser(1, { name: "New Name" }); // OK
\`\`\`

## Record

\`Record\` создаёт тип объекта с заданными ключами и значениями:

\`\`\`typescript
type StatusMap = Record<string, boolean>;

const features: StatusMap = {
  darkMode: true,
  notifications: false,
};
\`\`\`

Эти типы покрывают большинство повседневных задач при работе с TypeScript.`,
      excerpt:
        "Обзор встроенных utility-типов: Pick, Omit, Partial, Required, Record и когда их применять.",
      tags: JSON.stringify(["typescript", "типы"]),
      status: "published" as const,
      authorId: null,
      publishedAt: now - 86400,
      createdAt: now - 86400 * 2,
      updatedAt: now - 86400,
    })
    .onConflictDoUpdate({
      target: articles.slug,
      set: {
        title: "Полезные utility-типы в TypeScript",
        status: "published",
        publishedAt: now - 86400,
        updatedAt: now - 86400,
      },
    });

  // Статья 2 — от admin (authorId = null)
  await db
    .insert(articles)
    .values({
      id: ulid(),
      slug: "drizzle-orm-intro",
      title: "Drizzle ORM: быстрый старт с SQLite",
      content: `Drizzle ORM — лёгкий и типобезопасный ORM для TypeScript. Рассмотрим базовую настройку с SQLite.

## Установка

\`\`\`bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
\`\`\`

## Определение схемы

\`\`\`typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});
\`\`\`

## Запросы

\`\`\`typescript
import { db } from "./db";
import { posts } from "./schema";
import { eq, desc } from "drizzle-orm";

const allPosts = await db.select().from(posts).all();

const post = await db
  .select()
  .from(posts)
  .where(eq(posts.id, "abc123"))
  .get();
\`\`\`

Drizzle отлично подходит для проектов, где важна типобезопасность без overhead тяжёлых ORM.`,
      excerpt:
        "Настройка Drizzle ORM с SQLite: схема, миграции и типобезопасные запросы.",
      tags: JSON.stringify(["drizzle", "sqlite", "orm"]),
      status: "published" as const,
      authorId: null,
      publishedAt: now - 3600,
      createdAt: now - 86400,
      updatedAt: now - 3600,
    })
    .onConflictDoUpdate({
      target: articles.slug,
      set: {
        title: "Drizzle ORM: быстрый старт с SQLite",
        status: "published",
        publishedAt: now - 3600,
        updatedAt: now - 3600,
      },
    });

  // Статья 3 — от тестового автора (authorId = AUTHOR_ID)
  await db
    .insert(articles)
    .values({
      id: ulid(),
      slug: "mdx-interactive-components",
      title: "Интерактивные MDX-компоненты: раскрывающийся контент",
      content: `В этом блоге используются кастомные MDX-компоненты, которые делают статьи интерактивными.

## Раскрывающийся контент

Компонент \`<Expandable>\` позволяет скрывать дополнительный материал.

<Expandable title="Что такое MDX?">
MDX — это формат, который позволяет использовать JSX-компоненты внутри Markdown-документов.
</Expandable>

## Подсветка кода

\`\`\`typescript
interface BlogPost {
  title: string;
  content: string;
  tags: string[];
  publishedAt: Date | null;
}
\`\`\`

Все эти компоненты можно комбинировать в одной статье.`,
      excerpt:
        "Обзор кастомных MDX-компонентов блога: Expandable для скрытого контента.",
      tags: JSON.stringify(["mdx", "компоненты", "интерактивность"]),
      status: "published" as const,
      authorId: AUTHOR_ID,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: articles.slug,
      set: {
        title: "Интерактивные MDX-компоненты: раскрывающийся контент",
        authorId: AUTHOR_ID,
        status: "published",
        publishedAt: now,
        updatedAt: now,
      },
    });

  console.log("✅ Articles seeded (3 статьи: 2 от admin, 1 от author)");
  console.log("");
  console.log("Тестовые аккаунты:");
  console.log("  reader   / password  (role: reader)");
  console.log("  author   / password  (role: author)");
  console.log("  reviewer / password  (role: reviewer)");
  console.log("  reviewer2 / password  (role: reviewer)");
  console.log("  admin    / (из ADMIN_PASSWORD_HASH в .env.test)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
