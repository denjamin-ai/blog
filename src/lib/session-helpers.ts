/**
 * Вспомогательные функции для работы с review sessions.
 * Централизует логику создания сессии + назначений + чеклистов.
 */

import { db } from "@/lib/db";
import {
  reviewSessions,
  reviewAssignments,
  reviewChecklists,
  notifications,
  profile,
  users,
} from "@/lib/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { ulid } from "ulid";
import type { DifficultyLevel } from "@/types";

/**
 * Создаёт reviewSession + N reviewAssignment + N reviewChecklist.
 * Возвращает id созданной сессии и список id назначений.
 */
export async function createSessionWithAssignments({
  articleId,
  articleVersionId,
  reviewerIds,
  now,
}: {
  articleId: string;
  articleVersionId: string;
  reviewerIds: string[];
  now: number;
}): Promise<{ sessionId: string; assignmentIds: string[] }> {
  // Загрузить шаблон чеклиста до начала транзакции
  const prof = await db
    .select({ checklistTemplate: profile.checklistTemplate })
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();

  let checklistItems: { text: string; checked: boolean }[] = [];
  if (prof?.checklistTemplate) {
    try {
      const tmpl: { text: string }[] = JSON.parse(prof.checklistTemplate);
      checklistItems = tmpl.map((i) => ({ text: i.text, checked: false }));
    } catch {
      checklistItems = [];
    }
  }

  const sessionId = ulid();
  const assignmentIds: string[] = [];
  const notificationRows: Parameters<typeof db.insert<typeof notifications>>[0] extends
    (table: infer T) => unknown
    ? never
    : {
        id: string;
        recipientId: string | null;
        isAdminRecipient: number;
        type: "assignment_created";
        payload: string;
        isRead: number;
        createdAt: number;
      }[] = [];

  for (const reviewerId of reviewerIds) {
    const assignmentId = ulid();
    assignmentIds.push(assignmentId);
    notificationRows.push({
      id: ulid(),
      recipientId: reviewerId,
      isAdminRecipient: 0,
      type: "assignment_created",
      payload: JSON.stringify({ articleId, assignmentId, sessionId }),
      isRead: 0,
      createdAt: now,
    });
  }

  // Выполнить все вставки в одной транзакции
  await db.transaction(async (tx) => {
    await tx.insert(reviewSessions).values({
      id: sessionId,
      articleId,
      articleVersionId,
      status: "open",
      createdAt: now,
      completedAt: null,
    });

    for (let i = 0; i < reviewerIds.length; i++) {
      const reviewerId = reviewerIds[i];
      const assignmentId = assignmentIds[i];

      await tx.insert(reviewAssignments).values({
        id: assignmentId,
        sessionId,
        articleId,
        articleVersionId,
        reviewerId,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      if (checklistItems.length > 0) {
        await tx.insert(reviewChecklists).values({
          id: ulid(),
          assignmentId,
          items: JSON.stringify(checklistItems),
          createdAt: now,
        });
      }
    }

    // Уведомления вставляем в конце транзакции
    if (notificationRows.length > 0) {
      await tx.insert(notifications).values(notificationRows);
    }
  });

  return { sessionId, assignmentIds };
}

/**
 * Проверяет минимальное кол-во ревьюеров по сложности статьи.
 * Возвращает null если валидно, иначе строку с ошибкой.
 */
export function validateReviewerCount(
  reviewerIds: string[],
  difficulty: DifficultyLevel | null | undefined,
  max = 3,
): string | null {
  if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    return "Нужен хотя бы один ревьюер";
  }
  if (reviewerIds.length > max) {
    return `Максимум ${max} ревьюера`;
  }
  const minRequired = difficulty === "hard" ? 2 : 1;
  if (reviewerIds.length < minRequired) {
    return difficulty === "hard"
      ? "Для сложных статей нужно минимум 2 ревьюера"
      : "Нужен хотя бы один ревьюер";
  }
  return null;
}

/**
 * Проверяет, может ли пользователь читать/писать в чат сессии.
 * Возвращает роль доступа или null если запрещено.
 */
export async function resolveSessionAccess(
  sessionId: string,
  session: { isAdmin: boolean; userId?: string },
): Promise<{ role: "admin" | "author" | "reviewer"; reviewSession: typeof reviewSessions.$inferSelect } | null> {
  if (!session.isAdmin && !session.userId) return null;

  const reviewSession = await db
    .select()
    .from(reviewSessions)
    .where(eq(reviewSessions.id, sessionId))
    .get();

  if (!reviewSession) return null;

  if (session.isAdmin) return { role: "admin", reviewSession };

  // Проверить: является ли пользователь автором статьи
  const { articles } = await import("@/lib/db/schema");
  const article = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, reviewSession.articleId))
    .get();

  if (article?.authorId === session.userId) {
    return { role: "author", reviewSession };
  }

  // Проверить: является ли ревьюером в этой сессии
  const assignment = await db
    .select({ id: reviewAssignments.id })
    .from(reviewAssignments)
    .where(
      and(
        eq(reviewAssignments.sessionId, sessionId),
        eq(reviewAssignments.reviewerId, session.userId!),
      ),
    )
    .get();

  if (assignment) return { role: "reviewer", reviewSession };

  return null;
}

/**
 * Возвращает всех активных (pending/accepted) ревьюеров сессии для статьи.
 * Используется для фан-аут уведомлений в notify_reviewer.
 */
export async function getActiveSessionReviewers(
  articleId: string,
): Promise<{ reviewerId: string; assignmentId: string; sessionId: string }[]> {
  const rows = await db
    .select({
      reviewerId: reviewAssignments.reviewerId,
      assignmentId: reviewAssignments.id,
      sessionId: reviewAssignments.sessionId,
    })
    .from(reviewAssignments)
    .where(
      and(
        eq(reviewAssignments.articleId, articleId),
        or(
          eq(reviewAssignments.status, "pending"),
          eq(reviewAssignments.status, "accepted"),
        ),
      ),
    );

  return rows.filter((r) => r.sessionId !== null) as {
    reviewerId: string;
    assignmentId: string;
    sessionId: string;
  }[];
}
