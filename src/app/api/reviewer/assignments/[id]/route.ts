import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reviewAssignments,
  articleVersions,
  reviewComments,
  notifications,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (assignment.reviewerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const version = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  const comments = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.assignmentId, id))
    .orderBy(desc(reviewComments.createdAt));

  const resolvedCount = comments.filter((c) => c.resolvedAt !== null).length;
  const totalComments = comments.length;

  return NextResponse.json({
    ...assignment,
    version,
    comments,
    resolvedCount,
    totalComments,
  });
}

export async function PATCH(
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

  let body: {
    status?: unknown;
    reviewerNote?: unknown;
    verdict?: unknown;
    verdictNote?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { status, reviewerNote, verdict, verdictNote } = body;

  const validStatuses = ["accepted", "declined", "completed"];
  if (!status || !validStatuses.includes(status as string)) {
    return NextResponse.json(
      { error: "status должен быть accepted, declined или completed" },
      { status: 400 },
    );
  }

  if (reviewerNote !== undefined && typeof reviewerNote !== "string") {
    return NextResponse.json(
      { error: "Недопустимая заметка" },
      { status: 400 },
    );
  }
  if (typeof reviewerNote === "string" && reviewerNote.trim().length > 5000) {
    return NextResponse.json(
      { error: "Заметка слишком длинная" },
      { status: 400 },
    );
  }

  // Validate verdict when completing
  if (status === "completed") {
    const validVerdicts = ["approved", "needs_work", "rejected"];
    if (!verdict || !validVerdicts.includes(verdict as string)) {
      return NextResponse.json(
        { error: "Выберите результат ревью (verdict обязателен)" },
        { status: 400 },
      );
    }
    if (verdictNote !== undefined && typeof verdictNote !== "string") {
      return NextResponse.json(
        { error: "Недопустимое резюме" },
        { status: 400 },
      );
    }
    if (typeof verdictNote === "string" && verdictNote.trim().length > 1000) {
      return NextResponse.json(
        { error: "Резюме не должно превышать 1000 символов" },
        { status: 400 },
      );
    }
  }

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (assignment.reviewerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate status transitions (completed/declined are terminal — empty arrays)
  const current = assignment.status;
  const next = status as string;
  const allowed: Record<string, string[]> = {
    pending: ["accepted", "declined"],
    accepted: ["completed", "declined"],
    completed: [],
    declined: [],
  };
  if (!allowed[current]?.includes(next)) {
    return NextResponse.json(
      { error: `Переход ${current} → ${next} недопустим` },
      { status: 422 },
    );
  }

  const now = Math.floor(Date.now() / 1000);

  await db
    .update(reviewAssignments)
    .set({
      status: next as "accepted" | "declined" | "completed",
      reviewerNote:
        typeof reviewerNote === "string"
          ? reviewerNote.trim()
          : assignment.reviewerNote,
      verdict:
        next === "completed" && typeof verdict === "string"
          ? (verdict as "approved" | "needs_work" | "rejected")
          : assignment.verdict,
      verdictNote:
        next === "completed" && typeof verdictNote === "string"
          ? verdictNote.trim() || null
          : assignment.verdictNote,
      updatedAt: now,
    })
    .where(eq(reviewAssignments.id, id));

  // Notify admin
  const notifType =
    next === "accepted"
      ? "assignment_accepted"
      : next === "declined"
        ? "assignment_declined"
        : "review_completed";

  const notifPayload =
    next === "completed"
      ? JSON.stringify({
          articleId: assignment.articleId,
          assignmentId: id,
          verdict,
        })
      : JSON.stringify({
          articleId: assignment.articleId,
          assignmentId: id,
        });

  await db.insert(notifications).values({
    id: ulid(),
    recipientId: null,
    isAdminRecipient: 1,
    type: notifType,
    payload: notifPayload,
    isRead: 0,
    createdAt: now,
  });

  return NextResponse.json({ ok: true });
}
