import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  reviewSessions,
  reviewAssignments,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: articleId } = await params;

  const article = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Проверка доступа: admin, автор статьи, или ревьюер в любой сессии
  if (!session.isAdmin) {
    const isAuthor = article.authorId === session.userId;
    if (!isAuthor) {
      // Проверить: является ли ревьюером в любой сессии этой статьи
      const assignmentInSession = await db
        .select({ id: reviewAssignments.id })
        .from(reviewAssignments)
        .where(
          and(
            eq(reviewAssignments.articleId, articleId),
            eq(reviewAssignments.reviewerId, session.userId!),
          ),
        )
        .get();
      if (!assignmentInSession) {
        return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
      }
    }
  }

  // Загрузить все сессии одним запросом
  const sessions = await db
    .select()
    .from(reviewSessions)
    .where(eq(reviewSessions.articleId, articleId))
    .orderBy(desc(reviewSessions.createdAt));

  if (sessions.length === 0) {
    return NextResponse.json([]);
  }

  // Загрузить все назначения одним запросом с JOIN
  const { inArray } = await import("drizzle-orm");
  const sessionIds = sessions.map((s) => s.id);
  const allAssignments = await db
    .select({
      id: reviewAssignments.id,
      sessionId: reviewAssignments.sessionId,
      reviewerId: reviewAssignments.reviewerId,
      reviewerName: users.name,
      reviewerUsername: users.username,
      status: reviewAssignments.status,
      verdict: reviewAssignments.verdict,
      verdictNote: reviewAssignments.verdictNote,
      articleVersionId: reviewAssignments.articleVersionId,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(inArray(reviewAssignments.sessionId, sessionIds));

  // Группируем назначения по sessionId
  const assignmentsBySession = new Map<string, typeof allAssignments>();
  for (const a of allAssignments) {
    if (!a.sessionId) continue;
    if (!assignmentsBySession.has(a.sessionId)) {
      assignmentsBySession.set(a.sessionId, []);
    }
    assignmentsBySession.get(a.sessionId)!.push(a);
  }

  const result = sessions.map((s) => ({
    ...s,
    assignments: assignmentsBySession.get(s.id) ?? [],
  }));

  return NextResponse.json(result);
}
