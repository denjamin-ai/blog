import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewComments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function resolveComment(assignmentId: string, commentId: string) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const assignment = await db
    .select({
      id: reviewAssignments.id,
      reviewerId: reviewAssignments.reviewerId,
    })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, assignmentId))
    .get();

  if (!assignment) {
    return {
      error: NextResponse.json({ error: "Не найдено" }, { status: 404 }),
    };
  }

  // Access: admin OR the assigned reviewer
  if (!session.isAdmin && assignment.reviewerId !== session.userId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const comment = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.id, commentId))
    .get();

  if (!comment || comment.assignmentId !== assignmentId) {
    return {
      error: NextResponse.json({ error: "Не найдено" }, { status: 404 }),
    };
  }

  return { session, comment };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;
  const resolved = await resolveComment(id, commentId);
  if (resolved.error) return resolved.error;

  const { session, comment } = resolved;

  // Only the author or admin can edit
  const isAuthor = !session!.isAdmin && session!.userId === comment!.authorId;
  if (!session!.isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const now = Math.floor(Date.now() / 1000);
  await db
    .update(reviewComments)
    .set({ content: content.trim(), updatedAt: now })
    .where(eq(reviewComments.id, commentId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;
  const resolved = await resolveComment(id, commentId);
  if (resolved.error) return resolved.error;

  const { session, comment } = resolved;

  const isAuthor = !session!.isAdmin && session!.userId === comment!.authorId;
  if (!session!.isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(reviewComments).where(eq(reviewComments.id, commentId));

  return NextResponse.json({ ok: true });
}
