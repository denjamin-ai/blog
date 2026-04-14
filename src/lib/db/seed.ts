import { db } from "./index";
import { profile, articles, users } from "./schema";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";

const now = Math.floor(Date.now() / 1000);

async function seed() {
  // Seed profile
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

  console.log("Profile seeded");

  // Seed articles
  const article1 = {
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
    publishedAt: now - 86400,
    createdAt: now - 86400 * 2,
    updatedAt: now - 86400,
  };

  const article2 = {
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

Схема описывается в TypeScript:

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

Drizzle предоставляет типобезопасный query builder:

\`\`\`typescript
import { db } from "./db";
import { posts } from "./schema";
import { eq, desc } from "drizzle-orm";

// Все посты
const allPosts = await db.select().from(posts).all();

// Фильтрация
const post = await db
  .select()
  .from(posts)
  .where(eq(posts.id, "abc123"))
  .get();

// Сортировка
const recent = await db
  .select()
  .from(posts)
  .orderBy(desc(posts.createdAt))
  .limit(5)
  .all();
\`\`\`

Drizzle отлично подходит для проектов, где важна типобезопасность без overhead тяжёлых ORM.`,
    excerpt:
      "Настройка Drizzle ORM с SQLite: схема, миграции и типобезопасные запросы.",
    tags: JSON.stringify(["drizzle", "sqlite", "orm"]),
    status: "published" as const,
    publishedAt: now,
    createdAt: now - 86400,
    updatedAt: now,
  };

  const article3 = {
    id: ulid(),
    slug: "mdx-interactive-components",
    title: "Интерактивные MDX-компоненты: раскрывающийся контент",
    content: `В этом блоге используются кастомные MDX-компоненты, которые делают статьи интерактивными.

## Раскрывающийся контент

Компонент \`<Expandable>\` позволяет скрывать дополнительный материал — определения, примеры, комментарии. Читатель видит заголовок и может раскрыть содержимое по клику.

<Expandable title="Что такое MDX?">
MDX — это формат, который позволяет использовать JSX-компоненты внутри Markdown-документов. Это значит, что помимо обычного текста, заголовков и списков, вы можете вставлять интерактивные React-компоненты прямо в текст статьи.
</Expandable>

<Expandable title="Зачем нужны кастомные компоненты?">
Стандартный Markdown ограничен: текст, заголовки, списки, ссылки, изображения. Кастомные компоненты позволяют добавить интерактивность: раскрывающиеся блоки, табы, предупреждения и многое другое.
</Expandable>

## Подсветка кода

Все блоки кода подсвечиваются с помощью Shiki и поддерживают копирование в один клик:

\`\`\`typescript
interface BlogPost {
  title: string;
  content: string;
  tags: string[];
  publishedAt: Date | null;
}

function formatPost(post: BlogPost): string {
  const status = post.publishedAt ? "опубликован" : "черновик";
  return \`[\${status}] \${post.title} — \${post.tags.join(", ")}\`;
}
\`\`\`

Все эти компоненты можно комбинировать в одной статье для максимальной интерактивности.`,
    excerpt:
      "Обзор кастомных MDX-компонентов блога: Expandable для скрытого контента.",
    tags: JSON.stringify(["mdx", "компоненты", "интерактивность"]),
    status: "published" as const,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  for (const article of [article1, article2, article3]) {
    await db
      .insert(articles)
      .values(article)
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          tags: article.tags,
          status: article.status,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
        },
      });
  }

  console.log("Articles seeded (3 articles)");

  // Seed test reviewer
  const reviewerPasswordHash = await bcrypt.hash("reviewer123", 10);
  await db
    .insert(users)
    .values({
      id: ulid(),
      username: "reviewer",
      name: "Тестовый ревьер",
      role: "reviewer",
      passwordHash: reviewerPasswordHash,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: {
        name: "Тестовый ревьер",
        updatedAt: now,
      },
    });

  console.log("Test reviewer seeded (username: reviewer / reviewer123)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
