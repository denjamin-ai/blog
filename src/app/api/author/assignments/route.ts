import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  articleVersions,
  reviewAssignments,
  reviewComments,
  users,
  notifications,
} from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAuthor();

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  // Базовый фильтр: только назначения для статей этого автора
  const authorArticles = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.authorId, session.userId!));

  const authorArticleIds = authorArticles.map((a) => a.id);

  if (authorArticleIds.length === 0) {
    return NextResponse.json([]);
  }

  let rows: {
    id: string;
    articleId: string;
    articleVersionId: string;
    reviewerId: string;
    status: "pending" | "accepted" | "declined" | "completed";
    reviewerNote: string | null;
    verdict: string | null;
    verdictNote: string | null;
    createdAt: number;
    updatedAt: number;
    reviewerName: string | null;
    reviewerUsername: string | null;
    versionCreatedAt: number | null;
  }[];

  if (articleId) {
    // Проверяем, что эта статья принадлежит автору
    if (!authorArticleIds.includes(articleId)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    rows = await db
      .select({
        id: reviewAssignments.id,
        articleId: reviewAssignments.articleId,
        articleVersionId: reviewAssignments.articleVersionId,
        reviewerId: reviewAssignments.reviewerId,
        status: reviewAssignments.status,
        reviewerNote: reviewAssignments.reviewerNote,
        verdict: reviewAssignments.verdict,
        verdictNote: reviewAssignments.verdictNote,
        createdAt: reviewAssignments.createdAt,
        updatedAt: reviewAssignments.updatedAt,
        reviewerName: users.name,
        reviewerUsername: users.username,
        versionCreatedAt: articleVersions.createdAt,
      })
      .from(reviewAssignments)
      .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
      .leftJoin(
        articleVersions,
        eq(reviewAssignments.articleVersionId, articleVersions.id),
      )
      .where(eq(reviewAssignments.articleId, articleId))
      .orderBy(desc(reviewAssignments.createdAt));
  } else {
    // Все назначения для всех статей автора
    rows = await db
      .select({
        id: reviewAssignments.id,
        articleId: reviewAssignments.articleId,
        articleVersionId: reviewAssignments.articleVersionId,
        reviewerId: reviewAssignments.reviewerId,
        status: reviewAssignments.status,
        reviewerNote: reviewAssignments.reviewerNote,
        verdict: reviewAssignments.verdict,
        verdictNote: reviewAssignments.verdictNote,
        createdAt: reviewAssignments.createdAt,
        updatedAt: reviewAssignments.updatedAt,
        reviewerName: users.name,
        reviewerUsername: users.username,
        versionCreatedAt: articleVersions.createdAt,
      })
      .from(reviewAssignments)
      .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
      .leftJoin(
        articleVersions,
        eq(reviewAssignments.articleVersionId, articleVersions.id),
      )
      .where(
        and(
          ...(authorArticleIds.map((aid) =>
            eq(reviewAssignments.articleId, aid),
          ).length === 1
            ? [eq(reviewAssignments.articleId, authorArticleIds[0])]
            : [
                or(
                  ...authorArticleIds.map((aid) =>
                    eq(reviewAssignments.articleId, aid),
                  ),
                )!,
              ]),
        ),
      )
      .orderBy(desc(reviewAssignments.createdAt));
  }

  // Batch-fetch comment counts for all assignments in a single query
  const assignmentIds = rows.map((r) => r.id);
  const allCommentStats =
    assignmentIds.length > 0
      ? await db
          .select({
            assignmentId: reviewComments.assignmentId,
            resolvedAt: reviewComments.resolvedAt,
          })
          .from(reviewComments)
          .where(inArray(reviewComments.assignmentId, assignmentIds))
      : [];

  const enriched = rows.map((row) => {
    const rowComments = allCommentStats.filter(
      (c) => c.assignmentId === row.id,
    );
    return {
      ...row,
      totalComments: rowComments.length,
      resolvedCount: rowComments.filter((c) => c.resolvedAt !== null).length,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await requireAuthor();

  let body: { articleId?: unknown; reviewerId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { articleId, reviewerId } = body;

  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json(
      { error: "articleId обязателен" },
      { status: 400 },
    );
  }
  if (!reviewerId || typeof reviewerId !== "string") {
    return NextResponse.json(
      { error: "reviewerId обязателен" },
      { status: 400 },
    );
  }

  // Verify article exists and belongs to this author
  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
      authorId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  if (article.authorId !== session.userId!) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  // Verify reviewer exists and has correct role
  const reviewer = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, reviewerId))
    .get();

  if (!reviewer || reviewer.role !== "reviewer") {
    return NextResponse.json({ error: "Ревьер не найден" }, { status: 404 });
  }

  // Guard: no existing pending/accepted assignment for same (articleId, reviewerId)
  const existing = await db
    .select({ id: reviewAssignments.id })
    .from(reviewAssignments)
    .where(
      and(
        eq(reviewAssignments.articleId, articleId),
        eq(reviewAssignments.reviewerId, reviewerId),
        or(
          eq(reviewAssignments.status, "pending"),
          eq(reviewAssignments.status, "accepted"),
        ),
      ),
    )
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Уже есть активное назначение для этой пары статья/ревьер" },
      { status: 409 },
    );
  }

  const now = Math.floor(Date.now() / 1000);

  // Get or create version snapshot
  let versionId: string;
  const latestVersion = await db
    .select({ id: articleVersions.id })
    .from(articleVersions)
    .where(eq(articleVersions.articleId, articleId))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1)
    .get();

  if (latestVersion) {
    versionId = latestVersion.id;
  } else {
    versionId = ulid();
    await db.insert(articleVersions).values({
      id: versionId,
      articleId,
      title: article.title,
      content: article.content,
      createdAt: now,
      changeNote: "Снимок для ревью",
    });
  }

  const assignmentId = ulid();
  await db.insert(reviewAssignments).values({
    id: assignmentId,
    articleId,
    articleVersionId: versionId,
    reviewerId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  // Notify reviewer
  await db.insert(notifications).values({
    id: ulid(),
    recipientId: reviewerId,
    isAdminRecipient: 0,
    type: "assignment_created",
    payload: JSON.stringify({ articleId, assignmentId }),
    isRead: 0,
    createdAt: now,
  });

  return NextResponse.json({ id: assignmentId }, { status: 201 });
}
