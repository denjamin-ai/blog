import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, articleVersions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { ulid } from "ulid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { title, slug, content, excerpt, tags, status, changeNote } = body;

  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (slug && slug !== existing.slug) {
    const conflict = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), ne(articles.id, id)))
      .get();
    if (conflict) {
      return NextResponse.json(
        { error: "Статья с таким slug уже существует" },
        { status: 409 }
      );
    }
  }

  // Save version snapshot before updating
  await db.insert(articleVersions).values({
    id: ulid(),
    articleId: id,
    title: existing.title,
    content: existing.content,
    createdAt: Math.floor(Date.now() / 1000),
    changeNote: changeNote || null,
  });

  const now = Math.floor(Date.now() / 1000);
  const wasPublished = existing.status === "published";
  const isPublishing = status === "published";

  await db
    .update(articles)
    .set({
      title: title ?? existing.title,
      slug: slug ?? existing.slug,
      content: content ?? existing.content,
      excerpt: excerpt ?? existing.excerpt,
      tags: tags ? JSON.stringify(tags) : existing.tags,
      status: status ?? existing.status,
      publishedAt:
        isPublishing && !wasPublished ? now : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(articles.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  await db.delete(articles).where(eq(articles.id, id));

  return NextResponse.json({ ok: true });
}
