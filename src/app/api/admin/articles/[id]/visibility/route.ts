import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { action } = body;
  if (action !== "hide" && action !== "show") {
    return NextResponse.json(
      { error: "action должен быть 'hide' или 'show'" },
      { status: 400 },
    );
  }

  const article = await db
    .select({
      id: articles.id,
      status: articles.status,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000);

  if (action === "hide") {
    await db
      .update(articles)
      .set({ status: "draft", scheduledAt: null, updatedAt: now })
      .where(eq(articles.id, id));
  } else {
    await db
      .update(articles)
      .set({
        status: "published",
        publishedAt: article.publishedAt ?? now,
        updatedAt: now,
      })
      .where(eq(articles.id, id));
  }

  return NextResponse.json({ ok: true });
}
