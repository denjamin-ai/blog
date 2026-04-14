import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewComments,
  reviewAssignments,
  articles,
  notifications,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Не аутентифицирован" }, { status: 401 });
  }

  const { id } = await params;

  let body: { resolved?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  if (typeof body.resolved !== "boolean") {
    return NextResponse.json(
      { error: "resolved должен быть boolean" },
      { status: 400 },
    );
  }

  const { resolved } = body;

  // Fetch comment
  const comment = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.id, id))
    .get();

  if (!comment) {
    return NextResponse.json(
      { error: "Комментарий не найден" },
      { status: 404 },
    );
  }

  // Fetch assignment
  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, comment.assignmentId))
    .get();

  if (!assignment) {
    return NextResponse.json(
      { error: "Назначение не найдено" },
      { status: 404 },
    );
  }

  // Assignment must be active
  if (assignment.status !== "pending" && assignment.status !== "accepted") {
    return NextResponse.json(
      { error: "Ревью уже завершено или отклонено" },
      { status: 403 },
    );
  }

  // Fetch article for ownership check
  const article = await db
    .select({ id: articles.id, authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  const isAdmin = session.isAdmin;
  const isAuthor = session.userId === article.authorId;
  const isReviewer = session.userId === assignment.reviewerId;

  // Access rules:
  // resolved=true → admin or article author
  // resolved=false (reopen) → admin or reviewer
  if (resolved && !isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!resolved && !isAdmin && !isReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  // Admin has no users record → store null (consistent with authorId=null on admin comments).
  // User ID is stored for non-admin resolvers so the field is informational only.
  const resolvedBy = resolved ? (session.userId ?? null) : null;

  await db
    .update(reviewComments)
    .set({
      resolvedAt: resolved ? now : null,
      resolvedBy,
      updatedAt: now,
    })
    .where(eq(reviewComments.id, id));

  // When reviewer reopens → notify article author (or admin if article has no author)
  if (!resolved && isReviewer) {
    await db.insert(notifications).values({
      id: ulid(),
      recipientId: article.authorId ?? null,
      isAdminRecipient: article.authorId ? 0 : 1,
      type: "review_comment_reopened",
      payload: JSON.stringify({
        articleId: article.id,
        assignmentId: assignment.id,
        commentId: id,
      }),
      isRead: 0,
      createdAt: now,
    });
  }

  const updated = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.id, id))
    .get();

  if (!updated) {
    return NextResponse.json(
      { error: "Комментарий не найден" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated);
}
