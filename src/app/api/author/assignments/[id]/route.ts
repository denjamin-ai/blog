import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  reviewAssignments,
  reviewComments,
  users,
} from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getAssignmentForAuthor(id: string, authorUserId: string) {
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

  if (!assignment) return null;

  // Проверяем, что статья принадлежит этому автору
  const article = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  if (!article || article.authorId !== authorUserId) return null;

  return assignment;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthor();
  const { id } = await params;

  const assignment = await getAssignmentForAuthor(id, session.userId!);
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthor();
  const { id } = await params;

  const assignment = await getAssignmentForAuthor(id, session.userId!);
  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Можно отменить только pending-назначение
  if (assignment.status !== "pending") {
    return NextResponse.json(
      { error: "Можно отменить только назначение в статусе pending" },
      { status: 409 },
    );
  }

  await db.delete(reviewAssignments).where(eq(reviewAssignments.id, id));

  return NextResponse.json({ ok: true });
}
