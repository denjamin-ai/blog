import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  reviewAssignments,
  reviewComments,
  users,
} from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq, inArray, and, isNull, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Колорное семя для пина — стабильный hash по reviewerId,
// клиент использует его для HSL.
function colorSeed(reviewerId: string | null): number {
  if (!reviewerId) return 0;
  let h = 0;
  for (let i = 0; i < reviewerId.length; i++) {
    h = (h * 31 + reviewerId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthor();
  const { id: articleId } = await params;

  const article = await db
    .select({ id: articles.id, authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  if (!article || article.authorId !== session.userId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const assignments = await db
    .select({
      id: reviewAssignments.id,
      reviewerId: reviewAssignments.reviewerId,
      status: reviewAssignments.status,
      reviewerName: users.name,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(
      and(
        eq(reviewAssignments.articleId, articleId),
        // Declined назначения не показываем — они не участвуют в ревью.
        ne(reviewAssignments.status, "declined"),
      ),
    );

  if (assignments.length === 0) {
    return NextResponse.json({ comments: [], reviewers: [] });
  }

  const assignmentIds = assignments.map((a) => a.id);

  const rows = await db
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
    .where(
      and(
        inArray(reviewComments.assignmentId, assignmentIds),
        // Defense-in-depth: исключаем pending batch на уровне SQL.
        // Автор не должен видеть черновики ревьюеров (batchId != null).
        isNull(reviewComments.batchId),
      ),
    )
    .orderBy(reviewComments.createdAt);

  const visible = rows;

  const assignmentToReviewer = new Map(
    assignments.map((a) => [a.id, { id: a.reviewerId, name: a.reviewerName }]),
  );

  const enriched = visible.map((c) => {
    const reviewer = c.assignmentId
      ? assignmentToReviewer.get(c.assignmentId)
      : null;
    return {
      ...c,
      reviewerId: reviewer?.id ?? null,
      reviewerName: reviewer?.name ?? null,
      reviewerColorSeed: colorSeed(reviewer?.id ?? null),
    };
  });

  // Уникальные ревьюеры для chips-фильтра
  const reviewers = Array.from(
    new Map(
      assignments
        .filter((a) => a.reviewerId)
        .map((a) => [
          a.reviewerId!,
          {
            id: a.reviewerId!,
            name: a.reviewerName ?? "Ревьюер",
            colorSeed: colorSeed(a.reviewerId),
            assignmentId: a.id,
            status: a.status,
          },
        ]),
    ).values(),
  );

  return NextResponse.json({ comments: enriched, reviewers });
}
