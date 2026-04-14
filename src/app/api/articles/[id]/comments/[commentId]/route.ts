import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicComments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;

  const session = await getSession();
  if (!session.userId || session.userRole !== "reader") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await db
    .select()
    .from(publicComments)
    .where(eq(publicComments.id, commentId))
    .get();

  if (!comment || comment.articleId !== id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (comment.deletedAt !== null) {
    return NextResponse.json({ error: "Комментарий удалён" }, { status: 410 });
  }

  if (comment.authorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 15-minute edit window
  const now = Math.floor(Date.now() / 1000);
  if (now - comment.createdAt > 900) {
    return NextResponse.json(
      { error: "Окно редактирования (15 минут) истекло" },
      { status: 403 },
    );
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { content } = body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content обязателен" }, { status: 400 });
  }
  if (content.length > 10000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный" },
      { status: 400 },
    );
  }

  await db
    .update(publicComments)
    .set({ content: content.trim(), updatedAt: now })
    .where(eq(publicComments.id, commentId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;

  const session = await getSession();
  if (!session.userId && !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await db
    .select()
    .from(publicComments)
    .where(eq(publicComments.id, commentId))
    .get();

  if (!comment || comment.articleId !== id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (comment.deletedAt !== null) {
    return NextResponse.json({ error: "Уже удалён" }, { status: 410 });
  }

  const isAuthor = session.userId && comment.authorId === session.userId;
  if (!session.isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  await db
    .update(publicComments)
    .set({ deletedAt: now })
    .where(eq(publicComments.id, commentId));

  return NextResponse.json({ ok: true });
}
