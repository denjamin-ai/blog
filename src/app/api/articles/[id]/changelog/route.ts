import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, articleChangelog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Publicly accessible
  const { id } = await params;

  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const entries = await db
    .select()
    .from(articleChangelog)
    .where(eq(articleChangelog.articleId, id))
    .orderBy(desc(articleChangelog.entryDate));

  return NextResponse.json(entries);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let body: { entryDate?: unknown; section?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { entryDate, section, description } = body;

  if (
    typeof entryDate !== "number" ||
    !Number.isInteger(entryDate) ||
    entryDate <= 0
  ) {
    return NextResponse.json(
      { error: "entryDate обязателен (Unix seconds)" },
      { status: 400 },
    );
  }
  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "description обязателен" },
      { status: 400 },
    );
  }
  if (description.length > 5000) {
    return NextResponse.json(
      { error: "description слишком длинный (макс. 5000 символов)" },
      { status: 400 },
    );
  }
  if (section !== undefined && typeof section !== "string") {
    return NextResponse.json(
      { error: "Недопустимый section" },
      { status: 400 },
    );
  }
  if (typeof section === "string" && section.length > 255) {
    return NextResponse.json(
      { error: "section слишком длинный (макс. 255 символов)" },
      { status: 400 },
    );
  }

  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000);
  const entryId = ulid();

  await db.insert(articleChangelog).values({
    id: entryId,
    articleId: id,
    entryDate,
    section: typeof section === "string" ? section : null,
    description: description.trim(),
    createdAt: now,
  });

  return NextResponse.json({ id: entryId }, { status: 201 });
}
