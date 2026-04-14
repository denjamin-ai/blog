import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewComments, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const assignment = await db
    .select({
      id: reviewAssignments.id,
      articleId: reviewAssignments.articleId,
      articleVersionId: reviewAssignments.articleVersionId,
      reviewerId: reviewAssignments.reviewerId,
      status: reviewAssignments.status,
      reviewerNote: reviewAssignments.reviewerNote,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
      reviewerName: users.name,
      reviewerUsername: users.username,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const comments = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.assignmentId, id))
    .orderBy(desc(reviewComments.createdAt));

  return NextResponse.json({ ...assignment, comments });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { status } = body;

  const validStatuses = ["pending", "accepted", "declined", "completed"];
  if (
    status !== undefined &&
    (typeof status !== "string" || !validStatuses.includes(status))
  ) {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }

  const existing = await db
    .select({ id: reviewAssignments.id })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000);
  await db
    .update(reviewAssignments)
    .set({
      status: status as "pending" | "accepted" | "declined" | "completed",
      updatedAt: now,
    })
    .where(eq(reviewAssignments.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const existing = await db
    .select({ id: reviewAssignments.id })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await db.delete(reviewAssignments).where(eq(reviewAssignments.id, id));

  return NextResponse.json({ ok: true });
}
