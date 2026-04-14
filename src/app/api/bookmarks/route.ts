import { db } from "@/lib/db";
import { bookmarks, articles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and, count, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireUser();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: bookmarks.id,
        createdAt: bookmarks.createdAt,
        articleId: articles.id,
        slug: articles.slug,
        title: articles.title,
        excerpt: articles.excerpt,
        tags: articles.tags,
        coverImageUrl: articles.coverImageUrl,
      })
      .from(bookmarks)
      .innerJoin(articles, eq(bookmarks.articleId, articles.id))
      .where(eq(bookmarks.userId, session.userId!))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(bookmarks)
      .where(eq(bookmarks.userId, session.userId!))
      .get(),
  ]);

  return NextResponse.json({ bookmarks: rows, total: totalRows?.total ?? 0 });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireUser("reader");
  } catch (res) {
    return res as Response;
  }

  let body: { articleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный JSON" }, { status: 400 });
  }

  const { articleId } = body;
  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json(
      { error: "articleId обязателен" },
      { status: 400 },
    );
  }

  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.status, "published")))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  const { bookmarked } = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.userId!),
          eq(bookmarks.articleId, articleId),
        ),
      )
      .get();

    if (existing) {
      await tx.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return { bookmarked: false };
    } else {
      await tx.insert(bookmarks).values({
        id: ulid(),
        userId: session.userId!,
        articleId,
        createdAt: Math.floor(Date.now() / 1000),
      });
      return { bookmarked: true };
    }
  });

  return NextResponse.json({ bookmarked });
}
