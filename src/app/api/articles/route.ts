import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ulid } from "ulid";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  await requireAdmin();
  const allArticles = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.updatedAt));
  return NextResponse.json(allArticles);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const { title, slug, content, excerpt, tags, status } = body;

  if (!title || !slug) {
    return NextResponse.json(
      { error: "Заголовок и slug обязательны" },
      { status: 400 }
    );
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
      { status: 409 }
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const id = ulid();

  await db.insert(articles).values({
    id,
    title,
    slug,
    content: content || "",
    excerpt: excerpt || "",
    tags: JSON.stringify(tags || []),
    status: status || "draft",
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
