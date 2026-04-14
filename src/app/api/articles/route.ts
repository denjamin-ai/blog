import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { ulid } from "ulid";
import { desc, eq, and } from "drizzle-orm";

// Проверяет: запрос от admin или author. Возвращает { isAdmin, userId, userRole } или null.
async function resolveWriteAccess() {
  const session = await getSession();
  if (session.isAdmin) return { isAdmin: true, userId: null, userRole: null };
  if (session.userId && session.userRole === "author")
    return {
      isAdmin: false,
      userId: session.userId,
      userRole: "author" as const,
    };
  return null;
}

export async function GET() {
  const access = await resolveWriteAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let allArticles;
  if (access.isAdmin) {
    allArticles = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.updatedAt));
  } else {
    // Автор видит только свои статьи
    allArticles = await db
      .select()
      .from(articles)
      .where(and(eq(articles.authorId, access.userId!)))
      .orderBy(desc(articles.updatedAt));
  }

  return NextResponse.json(allArticles);
}

export async function POST(request: Request) {
  const access = await resolveWriteAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: {
    title?: unknown;
    slug?: unknown;
    content?: unknown;
    excerpt?: unknown;
    tags?: unknown;
    status?: unknown;
    coverImageUrl?: unknown;
    difficulty?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const {
    title,
    slug,
    content,
    excerpt,
    tags,
    status,
    coverImageUrl,
    difficulty,
  } = body;

  if (
    !title ||
    typeof title !== "string" ||
    title.trim().length === 0 ||
    title.length > 500
  ) {
    return NextResponse.json(
      { error: "Заголовок обязателен (макс. 500 символов)" },
      { status: 400 },
    );
  }
  if (
    !slug ||
    typeof slug !== "string" ||
    slug.trim().length === 0 ||
    slug.length > 255
  ) {
    return NextResponse.json(
      { error: "Slug обязателен (макс. 255 символов)" },
      { status: 400 },
    );
  }
  if (typeof content === "string" && content.length > 500_000) {
    return NextResponse.json(
      { error: "Контент слишком большой (макс. 500 000 символов)" },
      { status: 400 },
    );
  }
  if (typeof excerpt === "string" && excerpt.length > 1000) {
    return NextResponse.json(
      { error: "Описание слишком длинное (макс. 1000 символов)" },
      { status: 400 },
    );
  }

  if (status !== undefined && status !== "draft" && status !== "published") {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    return NextResponse.json(
      { error: "Теги должны быть массивом" },
      { status: 400 },
    );
  }

  // Заблокированный автор не может публиковать
  if (status === "published" && !access.isAdmin) {
    const author = await db
      .select({ isBlocked: users.isBlocked })
      .from(users)
      .where(eq(users.id, access.userId!))
      .get();
    if (author?.isBlocked) {
      return NextResponse.json(
        { error: "Публикация заблокирована администратором" },
        { status: 403 },
      );
    }
  }

  // Check slug uniqueness
  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Статья с таким slug уже существует" },
      { status: 409 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const id = ulid();

  try {
    await db.insert(articles).values({
      id,
      title,
      slug,
      content: typeof content === "string" ? content : "",
      excerpt: typeof excerpt === "string" ? excerpt : "",
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      status: status === "published" ? "published" : "draft",
      publishedAt: status === "published" ? now : null,
      // Автор проставляет authorId, admin оставляет null
      authorId: access.isAdmin ? null : access.userId,
      coverImageUrl:
        typeof coverImageUrl === "string" &&
        coverImageUrl.startsWith("/uploads/")
          ? coverImageUrl
          : null,
      difficulty:
        difficulty === "simple" ||
        difficulty === "medium" ||
        difficulty === "hard"
          ? difficulty
          : null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Статья с таким slug уже существует" },
        { status: 409 },
      );
    }
    console.error("POST /api/articles db.insert failed:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
