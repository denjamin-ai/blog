import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewComments,
  reviewAssignments,
  notifications,
  users,
  articles,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";
import { resolveSessionAccess } from "@/lib/session-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id: sessionId } = await params;

  const access = await resolveSessionAccess(sessionId, session);
  if (!access) {
    const hasAuth = session.isAdmin || !!session.userId;
    return NextResponse.json(
      { error: hasAuth ? "Нет доступа" : "Unauthorized" },
      { status: hasAuth ? 403 : 401 },
    );
  }

  const comments = await db
    .select({
      id: reviewComments.id,
      sessionId: reviewComments.sessionId,
      assignmentId: reviewComments.assignmentId,
      authorId: reviewComments.authorId,
      authorName: users.name,
      isAdminComment: reviewComments.isAdminComment,
      content: reviewComments.content,
      quotedText: reviewComments.quotedText,
      quotedAnchor: reviewComments.quotedAnchor,
      anchorType: reviewComments.anchorType,
      anchorData: reviewComments.anchorData,
      commentType: reviewComments.commentType,
      suggestionText: reviewComments.suggestionText,
      batchId: reviewComments.batchId,
      appliedAt: reviewComments.appliedAt,
      parentId: reviewComments.parentId,
      createdAt: reviewComments.createdAt,
      updatedAt: reviewComments.updatedAt,
      resolvedAt: reviewComments.resolvedAt,
      resolvedBy: reviewComments.resolvedBy,
    })
    .from(reviewComments)
    .leftJoin(users, eq(reviewComments.authorId, users.id))
    .where(eq(reviewComments.sessionId, sessionId))
    .orderBy(reviewComments.createdAt);

  // Pending batch comments visible only to admin and the comment author
  const filtered = comments.filter((c) => {
    if (c.batchId === null) return true;
    if (access.role === "admin") return true;
    if (access.role === "reviewer" && c.authorId === session.userId) return true;
    return false;
  });

  return NextResponse.json(filtered);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id: sessionId } = await params;

  const access = await resolveSessionAccess(sessionId, session);
  if (!access) {
    const hasAuth = session.isAdmin || !!session.userId;
    return NextResponse.json(
      { error: hasAuth ? "Нет доступа" : "Unauthorized" },
      { status: hasAuth ? 403 : 401 },
    );
  }

  // Автор статьи только читает — не пишет в чат ревью
  if (access.role === "author") {
    return NextResponse.json(
      { error: "Автор может только читать комментарии ревью" },
      { status: 403 },
    );
  }

  // Чат закрыт, если сессия не открыта
  if (access.reviewSession.status !== "open") {
    return NextResponse.json(
      { error: "Сессия завершена или отменена" },
      { status: 403 },
    );
  }

  let body: {
    content?: unknown;
    quotedText?: unknown;
    quotedAnchor?: unknown;
    parentId?: unknown;
    anchorType?: unknown;
    anchorData?: unknown;
    commentType?: unknown;
    suggestionText?: unknown;
    batchId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const { content, quotedText, quotedAnchor, parentId, anchorType, anchorData, commentType, suggestionText, batchId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Контент обязателен" }, { status: 400 });
  }
  if (content.length > 10_000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный (макс. 10 000 символов)" },
      { status: 400 },
    );
  }
  if (quotedText !== undefined && typeof quotedText === "string" && quotedText.length > 2_000) {
    return NextResponse.json({ error: "Цитата слишком длинная (макс. 2 000 символов)" }, { status: 400 });
  }
  if (quotedAnchor !== undefined && typeof quotedAnchor === "string" && quotedAnchor.length > 200) {
    return NextResponse.json({ error: "quotedAnchor слишком длинный" }, { status: 400 });
  }

  // --- Inline review fields ---
  const validAnchorTypes = ["text", "block", "general"];
  if (anchorType !== undefined && (typeof anchorType !== "string" || !validAnchorTypes.includes(anchorType))) {
    return NextResponse.json({ error: "Недопустимый anchorType" }, { status: 400 });
  }
  if (anchorData !== undefined && anchorData !== null) {
    if (typeof anchorData !== "string" || anchorData.length > 5_000) {
      return NextResponse.json({ error: "Недопустимый anchorData" }, { status: 400 });
    }
    try {
      const parsed = JSON.parse(anchorData);
      if (!Array.isArray(parsed.selectors)) throw new Error();
    } catch {
      return NextResponse.json({ error: "anchorData должен содержать selectors" }, { status: 400 });
    }
  }
  const validCommentTypes = ["comment", "suggestion"];
  if (commentType !== undefined && (typeof commentType !== "string" || !validCommentTypes.includes(commentType))) {
    return NextResponse.json({ error: "Недопустимый commentType" }, { status: 400 });
  }
  if (commentType === "suggestion") {
    if (!suggestionText || typeof suggestionText !== "string" || suggestionText.trim().length === 0) {
      return NextResponse.json({ error: "suggestionText обязателен для предложений" }, { status: 400 });
    }
    if (suggestionText.length > 10_000) {
      return NextResponse.json({ error: "suggestionText слишком длинный" }, { status: 400 });
    }
  }
  if (batchId !== undefined && batchId !== null && typeof batchId !== "string") {
    return NextResponse.json({ error: "Недопустимый batchId" }, { status: 400 });
  }

  // Валидация parentId: должен принадлежать той же сессии
  if (parentId !== undefined && parentId !== null) {
    if (typeof parentId !== "string") {
      return NextResponse.json({ error: "parentId должен быть строкой" }, { status: 400 });
    }
    const parent = await db
      .select({ id: reviewComments.id, sessionId: reviewComments.sessionId })
      .from(reviewComments)
      .where(eq(reviewComments.id, parentId))
      .get();
    if (!parent || parent.sessionId !== sessionId) {
      return NextResponse.json({ error: "Родительский комментарий не найден" }, { status: 404 });
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const commentId = ulid();

  await db.insert(reviewComments).values({
    id: commentId,
    sessionId,
    assignmentId: null,
    authorId: session.userId ?? null,
    isAdminComment: session.isAdmin ? 1 : 0,
    content: content.trim(),
    quotedText: typeof quotedText === "string" ? quotedText : null,
    quotedAnchor: typeof quotedAnchor === "string" ? quotedAnchor : null,
    anchorType: typeof anchorType === "string" ? anchorType as "text" | "block" | "general" : null,
    anchorData: typeof anchorData === "string" ? anchorData : null,
    commentType: typeof commentType === "string" ? commentType as "comment" | "suggestion" : null,
    suggestionText: typeof suggestionText === "string" ? suggestionText.trim() : null,
    batchId: typeof batchId === "string" ? batchId : null,
    parentId: typeof parentId === "string" ? parentId : null,
    createdAt: now,
    updatedAt: now,
  });

  // Уведомления фан-аут
  const { reviewSession } = access;

  // Получить authorId статьи
  const articleRow = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, reviewSession.articleId))
    .get();
  const articleAuthorId = articleRow?.authorId ?? null;

  // Получить всех ревьюеров сессии
  const sessionAssignments = await db
    .select({ reviewerId: reviewAssignments.reviewerId })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.sessionId, sessionId));

  const notifValues: Parameters<typeof db.insert>[0] extends (table: infer T) => infer R
    ? never
    : {
        id: string;
        recipientId: string | null;
        isAdminRecipient: number;
        type: "review_comment_reply";
        payload: string;
        isRead: number;
        createdAt: number;
      }[] = [];

  const payload = JSON.stringify({ sessionId, commentId, articleId: reviewSession.articleId });

  if (session.isAdmin) {
    // Admin пишет → notify всем ревьюерам + автору статьи
    for (const a of sessionAssignments) {
      notifValues.push({
        id: ulid(),
        recipientId: a.reviewerId,
        isAdminRecipient: 0,
        type: "review_comment_reply",
        payload,
        isRead: 0,
        createdAt: now,
      });
    }
    if (articleAuthorId) {
      notifValues.push({
        id: ulid(),
        recipientId: articleAuthorId,
        isAdminRecipient: 0,
        type: "review_comment_reply",
        payload,
        isRead: 0,
        createdAt: now,
      });
    }
  } else {
    // Ревьюер пишет → notify admin + автору статьи + другим ревьюерам
    notifValues.push({
      id: ulid(),
      recipientId: null,
      isAdminRecipient: 1,
      type: "review_comment_reply",
      payload,
      isRead: 0,
      createdAt: now,
    });
    if (articleAuthorId && articleAuthorId !== session.userId) {
      notifValues.push({
        id: ulid(),
        recipientId: articleAuthorId,
        isAdminRecipient: 0,
        type: "review_comment_reply",
        payload,
        isRead: 0,
        createdAt: now,
      });
    }
    // Другие ревьюеры
    for (const a of sessionAssignments) {
      if (a.reviewerId !== session.userId) {
        notifValues.push({
          id: ulid(),
          recipientId: a.reviewerId,
          isAdminRecipient: 0,
          type: "review_comment_reply",
          payload,
          isRead: 0,
          createdAt: now,
        });
      }
    }
  }

  if (notifValues.length > 0) {
    await db.insert(notifications).values(notifValues);
  }

  return NextResponse.json({ id: commentId }, { status: 201 });
}
