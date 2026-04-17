import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, reviewAssignments, reviewSessions, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, or, inArray } from "drizzle-orm";
import {
  createSessionWithAssignments,
  validateReviewerCount,
} from "@/lib/session-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isAdmin && session.userRole !== "author") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  let body: { articleId?: unknown; reviewerIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const { articleId, reviewerIds } = body;

  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json({ error: "articleId обязателен" }, { status: 400 });
  }

  if (!Array.isArray(reviewerIds)) {
    return NextResponse.json({ error: "reviewerIds должен быть массивом" }, { status: 400 });
  }

  // Проверить статью
  const article = await db
    .select({ id: articles.id, authorId: articles.authorId, difficulty: articles.difficulty })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Автор может отправлять только свои статьи на ревью
  if (!session.isAdmin && article.authorId !== session.userId) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  // Валидация кол-ва ревьюеров
  const countError = validateReviewerCount(reviewerIds as string[], article.difficulty);
  if (countError) {
    return NextResponse.json({ error: countError }, { status: 400 });
  }

  // Validate all IDs are non-empty strings
  const reviewerIdList = (reviewerIds as unknown[]).filter(
    (r): r is string => typeof r === "string" && r.length > 0,
  );
  if (reviewerIdList.length !== (reviewerIds as unknown[]).length) {
    return NextResponse.json({ error: "Некорректный reviewerId в массиве" }, { status: 400 });
  }

  // Batch-fetch всех ревьюеров одним запросом
  const foundReviewers = await db
    .select({ id: users.id, role: users.role, isBlocked: users.isBlocked })
    .from(users)
    .where(inArray(users.id, reviewerIdList));

  for (const rid of reviewerIdList) {
    const reviewer = foundReviewers.find((r) => r.id === rid);
    if (!reviewer || reviewer.role !== "reviewer") {
      return NextResponse.json({ error: `Ревьюер ${rid} не найден` }, { status: 404 });
    }
    if (reviewer.isBlocked) {
      return NextResponse.json({ error: `Ревьюер ${rid} заблокирован` }, { status: 400 });
    }
  }

  // Проверить: нет активных назначений в открытых сессиях этой статьи
  const openSessionRows = await db
    .select({ id: reviewSessions.id })
    .from(reviewSessions)
    .where(and(eq(reviewSessions.articleId, articleId), eq(reviewSessions.status, "open")));

  if (openSessionRows.length > 0) {
    const openSessionIds = openSessionRows.map((r) => r.id);
    const conflictAssignment = await db
      .select({ id: reviewAssignments.id, reviewerId: reviewAssignments.reviewerId })
      .from(reviewAssignments)
      .where(
        and(
          inArray(reviewAssignments.reviewerId, reviewerIdList),
          inArray(reviewAssignments.sessionId, openSessionIds),
          or(
            eq(reviewAssignments.status, "pending"),
            eq(reviewAssignments.status, "accepted"),
          ),
        ),
      )
      .get();
    if (conflictAssignment) {
      return NextResponse.json(
        { error: "Ревьюер уже имеет активное назначение в открытой сессии этой статьи" },
        { status: 409 },
      );
    }
  }

  // Нужен articleVersionId — берём последнюю версию или создадим пустую заглушку
  // На практике вызывающий код (UI) всегда предварительно сохраняет черновик,
  // поэтому версия должна существовать. Здесь берём последнюю версию статьи.
  const { articleVersions } = await import("@/lib/db/schema");
  const { desc } = await import("drizzle-orm");
  const latestVersion = await db
    .select({ id: articleVersions.id })
    .from(articleVersions)
    .where(eq(articleVersions.articleId, articleId))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1)
    .get();

  if (!latestVersion) {
    return NextResponse.json(
      { error: "Статья не имеет версий. Сначала сохраните черновик." },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const { sessionId, assignmentIds } = await createSessionWithAssignments({
    articleId,
    articleVersionId: latestVersion.id,
    reviewerIds: reviewerIdList,
    now,
  });

  return NextResponse.json({ sessionId, assignmentIds }, { status: 201 });
}
