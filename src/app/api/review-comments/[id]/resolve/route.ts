import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewComments,
  reviewAssignments,
  reviewSessions,
  articles,
  notifications,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";
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

  // Resolve context via session or assignment
  let articleId: string | null = null;
  let isReviewer = false;
  let sessionStatus: string | null = null;

  if (comment.sessionId) {
    // Новая схема: комментарий привязан к сессии
    const reviewSession = await db
      .select()
      .from(reviewSessions)
      .where(eq(reviewSessions.id, comment.sessionId))
      .get();

    if (!reviewSession) {
      return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
    }

    sessionStatus = reviewSession.status;
    articleId = reviewSession.articleId;

    // Проверить: является ли ревьюером в сессии
    if (session.userId) {
      const assignment = await db
        .select({ id: reviewAssignments.id })
        .from(reviewAssignments)
        .where(
          and(
            eq(reviewAssignments.sessionId, comment.sessionId),
            eq(reviewAssignments.reviewerId, session.userId),
          ),
        )
        .get();
      isReviewer = !!assignment;
    }
  } else if (comment.assignmentId) {
    // Старая схема: комментарий привязан к назначению
    const assignment = await db
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, comment.assignmentId))
      .get();

    if (!assignment) {
      return NextResponse.json({ error: "Назначение не найдено" }, { status: 404 });
    }

    sessionStatus = assignment.status === "pending" || assignment.status === "accepted"
      ? "open"
      : "closed";
    articleId = assignment.articleId;
    isReviewer = session.userId === assignment.reviewerId;
  } else {
    return NextResponse.json({ error: "Комментарий без контекста" }, { status: 400 });
  }

  // Чат закрыт, если сессия/назначение завершены
  if (sessionStatus !== "open") {
    return NextResponse.json(
      { error: "Ревью уже завершено" },
      { status: 403 },
    );
  }

  if (!articleId) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Fetch article for authorId
  const article = await db
    .select({ id: articles.id, authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  const isAdmin = session.isAdmin;
  const isAuthor = !!article?.authorId && session.userId === article.authorId;

  // Access rules:
  // resolved=true → admin or article author
  // resolved=false (reopen) → admin or reviewer в сессии
  if (resolved && !isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!resolved && !isAdmin && !isReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
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
  if (!resolved && isReviewer && article) {
    await db.insert(notifications).values({
      id: ulid(),
      recipientId: article.authorId ?? null,
      isAdminRecipient: article.authorId ? 0 : 1,
      type: "review_comment_reopened",
      payload: JSON.stringify({
        articleId: article.id,
        sessionId: comment.sessionId,
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
