import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewComments,
  reviewSessions,
  articles,
  articleVersions,
  notifications,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import { stripDangerousHtml } from "@/lib/mdx";

export const dynamic = "force-dynamic";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the comment
  const comment = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.id, id))
    .get();

  if (!comment) {
    return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 });
  }
  if (comment.commentType !== "suggestion") {
    return NextResponse.json({ error: "Не является предложением" }, { status: 400 });
  }
  if (!comment.suggestionText) {
    return NextResponse.json({ error: "Текст предложения отсутствует" }, { status: 400 });
  }

  // Resolve session and article
  if (!comment.sessionId) {
    return NextResponse.json({ error: "Комментарий не привязан к сессии" }, { status: 400 });
  }

  const reviewSession = await db
    .select()
    .from(reviewSessions)
    .where(eq(reviewSessions.id, comment.sessionId))
    .get();

  if (!reviewSession) {
    return NextResponse.json({ error: "Сессия ревью не найдена" }, { status: 404 });
  }
  if (reviewSession.status !== "open") {
    return NextResponse.json({ error: "Сессия ревью завершена или отменена" }, { status: 403 });
  }

  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, reviewSession.articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Auth: admin or article author
  const isAdmin = session.isAdmin;
  const isAuthor = article.authorId !== null && article.authorId === session.userId;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Extract exact text from anchorData
  if (!comment.anchorData) {
    return NextResponse.json(
      { error: "Нет данных привязки для применения предложения" },
      { status: 400 },
    );
  }

  let quoteExact: string;
  try {
    const parsed = JSON.parse(comment.anchorData);
    const quoteSelector = parsed.selectors?.find(
      (s: { type: string }) => s.type === "TextQuoteSelector",
    );
    if (!quoteSelector?.exact) throw new Error();
    quoteExact = quoteSelector.exact;
  } catch {
    return NextResponse.json(
      { error: "Невозможно извлечь TextQuoteSelector" },
      { status: 400 },
    );
  }

  const sanitized = stripDangerousHtml(comment.suggestionText);
  const now = Math.floor(Date.now() / 1000);

  // All checks and mutations inside transaction to prevent TOCTOU race
  const txResult = await db.transaction(async (tx) => {
    // Atomic guard: mark as applied only if not yet applied
    const updated = await tx
      .update(reviewComments)
      .set({
        appliedAt: now,
        updatedAt: now,
        resolvedAt: now,
        resolvedBy: session.userId ?? null,
      })
      .where(and(eq(reviewComments.id, id), isNull(reviewComments.appliedAt)));

    if (updated.rowsAffected === 0) {
      return { error: "Предложение уже применено", status: 409 as const };
    }

    // Re-read article content inside transaction
    const freshArticle = await tx
      .select({ content: articles.content, title: articles.title })
      .from(articles)
      .where(eq(articles.id, article.id))
      .get();

    if (!freshArticle) {
      return { error: "Статья не найдена", status: 404 as const };
    }

    const oldContent = freshArticle.content;
    const idx = oldContent.indexOf(quoteExact);
    if (idx === -1) {
      return {
        error: "Исходный текст не найден в статье — возможно, контент был изменён",
        status: 422 as const,
      };
    }

    const newContent =
      oldContent.slice(0, idx) + sanitized + oldContent.slice(idx + quoteExact.length);

    // Snapshot before update
    await tx.insert(articleVersions).values({
      id: ulid(),
      articleId: article.id,
      title: freshArticle.title,
      content: oldContent,
      createdAt: now,
      changeNote: `Применено предложение из ревью (${comment.id})`,
    });

    // Update article content
    await tx
      .update(articles)
      .set({ content: newContent, updatedAt: now })
      .where(eq(articles.id, article.id));

    return null;
  });

  if (txResult) {
    return NextResponse.json({ error: txResult.error }, { status: txResult.status });
  }

  // Notify the reviewer who made the suggestion
  if (comment.authorId) {
    await db.insert(notifications).values({
      id: ulid(),
      recipientId: comment.authorId,
      isAdminRecipient: 0,
      type: "suggestion_applied",
      payload: JSON.stringify({
        articleId: article.id,
        sessionId: comment.sessionId,
        commentId: id,
      }),
      isRead: 0,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}
