import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewAssignments,
  reviewComments,
  notifications,
  articles,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

// resolveAccess: reviewer or admin can read+write; article author can read only
async function resolveAccess(assignmentId: string, write = false) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, assignmentId))
    .get();

  if (!assignment) {
    return {
      error: NextResponse.json({ error: "Не найдено" }, { status: 404 }),
    };
  }

  const isReviewer = assignment.reviewerId === session.userId;

  if (!session.isAdmin && !isReviewer) {
    // Check if article author (read-only access)
    if (!write) {
      const article = await db
        .select({ authorId: articles.authorId })
        .from(articles)
        .where(eq(articles.id, assignment.articleId))
        .get();
      if (article?.authorId && article.authorId === session.userId) {
        return { session, assignment };
      }
    }
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, assignment };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await resolveAccess(id);
  if (access.error) return access.error;

  const { session, assignment } = access;

  // Делегируем к session chat, если sessionId доступен
  if (assignment!.sessionId) {
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
      .where(eq(reviewComments.sessionId, assignment!.sessionId))
      .orderBy(reviewComments.createdAt);

    // Pending batch comments visible only to admin and the comment author
    const filtered = comments.filter((c) => {
      if (c.batchId === null) return true;
      if (session!.isAdmin) return true;
      if (c.authorId === session!.userId) return true;
      return false;
    });
    return NextResponse.json(filtered);
  }

  // Fallback: старые комментарии без sessionId
  const comments = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.assignmentId, id))
    .orderBy(reviewComments.createdAt);

  // Apply same batch visibility filter as session path
  const filtered = comments.filter((c) => {
    if (c.batchId === null) return true;
    if (session!.isAdmin) return true;
    if (c.authorId === session!.userId) return true;
    return false;
  });

  return NextResponse.json(filtered);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await resolveAccess(id, true);
  if (access.error) return access.error;

  const { session, assignment } = access;

  if (assignment!.status === "completed" || assignment!.status === "declined") {
    return NextResponse.json(
      {
        error:
          "Невозможно добавить комментарий к завершённому или отклонённому назначению",
      },
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
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { content, quotedText, quotedAnchor, parentId, anchorType, anchorData, commentType, suggestionText, batchId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content обязателен" }, { status: 400 });
  }
  if (content.length > 10000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный" },
      { status: 400 },
    );
  }
  if (typeof quotedText === "string" && quotedText.length > 2000) {
    return NextResponse.json({ error: "Цитата слишком длинная" }, { status: 400 });
  }
  if (typeof quotedAnchor === "string" && quotedAnchor.length > 200) {
    return NextResponse.json({ error: "Недопустимый quotedAnchor" }, { status: 400 });
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

  // Validate parentId belongs to same session/assignment
  if (parentId !== undefined && parentId !== null) {
    if (typeof parentId !== "string") {
      return NextResponse.json({ error: "Недопустимый parentId" }, { status: 400 });
    }
    const parent = await db
      .select({ sessionId: reviewComments.sessionId, assignmentId: reviewComments.assignmentId })
      .from(reviewComments)
      .where(eq(reviewComments.id, parentId))
      .get();

    const sameContext = assignment!.sessionId
      ? parent?.sessionId === assignment!.sessionId
      : parent?.assignmentId === id;

    if (!parent || !sameContext) {
      return NextResponse.json(
        { error: "Родительский комментарий не найден" },
        { status: 400 },
      );
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const commentId = ulid();
  const isAdminComment = session!.isAdmin ? 1 : 0;
  const authorId = session!.isAdmin ? null : (session!.userId ?? null);

  // Сохраняем с sessionId (если есть) + assignmentId для трассируемости
  await db.insert(reviewComments).values({
    id: commentId,
    sessionId: assignment!.sessionId ?? null,
    assignmentId: id,
    authorId,
    isAdminComment,
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

  // Notify on reply
  if (parentId) {
    const parent = await db
      .select({
        authorId: reviewComments.authorId,
        isAdminComment: reviewComments.isAdminComment,
      })
      .from(reviewComments)
      .where(eq(reviewComments.id, parentId as string))
      .get();

    if (parent) {
      if (parent.isAdminComment && !session!.isAdmin) {
        await db.insert(notifications).values({
          id: ulid(),
          recipientId: null,
          isAdminRecipient: 1,
          type: "review_comment_reply",
          payload: JSON.stringify({
            articleId: assignment!.articleId,
            assignmentId: id,
            commentId,
          }),
          isRead: 0,
          createdAt: now,
        });
      } else if (!parent.isAdminComment && parent.authorId && session!.isAdmin) {
        await db.insert(notifications).values({
          id: ulid(),
          recipientId: parent.authorId,
          isAdminRecipient: 0,
          type: "review_comment_reply",
          payload: JSON.stringify({
            articleId: assignment!.articleId,
            assignmentId: id,
            commentId,
          }),
          isRead: 0,
          createdAt: now,
        });
      }
    }
  }

  return NextResponse.json({ id: commentId }, { status: 201 });
}
