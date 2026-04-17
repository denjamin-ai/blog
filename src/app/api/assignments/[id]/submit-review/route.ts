import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewAssignments,
  reviewComments,
  reviewSessions,
  articles,
  notifications,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and, isNotNull } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  let body: { verdict?: unknown; verdictNote?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const { verdict, verdictNote } = body;

  // Load assignment
  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Назначение не найдено" }, { status: 404 });
  }
  if (assignment.reviewerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (assignment.status !== "accepted") {
    return NextResponse.json(
      { error: "Отправить ревью можно только из статуса accepted" },
      { status: 422 },
    );
  }
  if (!assignment.sessionId) {
    return NextResponse.json(
      { error: "Назначение не привязано к сессии" },
      { status: 400 },
    );
  }

  // Validate verdict (required)
  const validVerdicts = ["approved", "needs_work", "rejected"];
  if (!verdict || typeof verdict !== "string" || !validVerdicts.includes(verdict)) {
    return NextResponse.json(
      { error: "verdict обязателен: approved, needs_work или rejected" },
      { status: 400 },
    );
  }
  if (verdictNote !== undefined && typeof verdictNote !== "string") {
    return NextResponse.json({ error: "Недопустимый verdictNote" }, { status: 400 });
  }
  if (typeof verdictNote === "string" && verdictNote.length > 1000) {
    return NextResponse.json(
      { error: "verdictNote не должен превышать 1000 символов" },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);

  // All mutations inside transaction for atomicity
  const pendingCount = await db.transaction(async (tx) => {
    // Atomic guard: only transition from accepted
    const guardResult = await tx
      .update(reviewAssignments)
      .set({
        status: "completed",
        verdict: verdict as "approved" | "needs_work" | "rejected",
        verdictNote: typeof verdictNote === "string" ? verdictNote.trim() || null : null,
        updatedAt: now,
      })
      .where(and(eq(reviewAssignments.id, id), eq(reviewAssignments.status, "accepted")));

    if (guardResult.rowsAffected === 0) {
      throw new Error("ALREADY_SUBMITTED");
    }

    // Batch-publish: set batchId to null for all pending comments
    const pendingComments = await tx
      .select({ id: reviewComments.id })
      .from(reviewComments)
      .where(
        and(
          eq(reviewComments.sessionId, assignment.sessionId!),
          eq(reviewComments.authorId, session.userId!),
          isNotNull(reviewComments.batchId),
        ),
      );

    for (const c of pendingComments) {
      await tx
        .update(reviewComments)
        .set({ batchId: null, updatedAt: now })
        .where(eq(reviewComments.id, c.id));
    }

    // Auto-complete session if all reviewers approved
    if (verdict === "approved") {
      const sessionAssignments = await tx
        .select({ status: reviewAssignments.status, verdict: reviewAssignments.verdict })
        .from(reviewAssignments)
        .where(eq(reviewAssignments.sessionId, assignment.sessionId!));

      const allApproved = sessionAssignments.every(
        (a) => a.status === "completed" && a.verdict === "approved",
      );

      if (allApproved) {
        await tx
          .update(reviewSessions)
          .set({ status: "completed", completedAt: now })
          .where(eq(reviewSessions.id, assignment.sessionId!));
      }
    }

    return pendingComments.length;
  }).catch((err) => {
    if (err.message === "ALREADY_SUBMITTED") return null;
    throw err;
  });

  if (pendingCount === null) {
    return NextResponse.json(
      { error: "Ревью уже отправлено" },
      { status: 409 },
    );
  }

  // Notify admin + article author
  const article = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  const payload = JSON.stringify({
    articleId: assignment.articleId,
    assignmentId: id,
    sessionId: assignment.sessionId,
    verdict: verdict ?? null,
    submittedCount: pendingCount,
  });

  const notifValues: {
    id: string;
    recipientId: string | null;
    isAdminRecipient: number;
    type: "review_submitted";
    payload: string;
    isRead: number;
    createdAt: number;
  }[] = [];

  // Admin notification
  notifValues.push({
    id: ulid(),
    recipientId: null,
    isAdminRecipient: 1,
    type: "review_submitted",
    payload,
    isRead: 0,
    createdAt: now,
  });

  // Article author notification
  if (article?.authorId && article.authorId !== session.userId) {
    notifValues.push({
      id: ulid(),
      recipientId: article.authorId,
      isAdminRecipient: 0,
      type: "review_submitted",
      payload,
      isRead: 0,
      createdAt: now,
    });
  }

  if (notifValues.length > 0) {
    await db.insert(notifications).values(notifValues);
  }

  return NextResponse.json({
    submitted: pendingCount,
    verdict: verdict ?? null,
  });
}
