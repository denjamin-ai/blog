import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewSessions, reviewAssignments, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { resolveSessionAccess } from "@/lib/session-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;

  const access = await resolveSessionAccess(id, session);
  if (!access) {
    const hasAuth = session.isAdmin || !!session.userId;
    return NextResponse.json(
      { error: hasAuth ? "Нет доступа" : "Unauthorized" },
      { status: hasAuth ? 403 : 401 },
    );
  }

  const { reviewSession } = access;

  // Загрузить назначения с именами ревьюеров
  const assignments = await db
    .select({
      id: reviewAssignments.id,
      sessionId: reviewAssignments.sessionId,
      reviewerId: reviewAssignments.reviewerId,
      reviewerName: users.name,
      reviewerUsername: users.username,
      status: reviewAssignments.status,
      verdict: reviewAssignments.verdict,
      verdictNote: reviewAssignments.verdictNote,
      reviewerNote: reviewAssignments.reviewerNote,
      articleVersionId: reviewAssignments.articleVersionId,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(eq(reviewAssignments.sessionId, id));

  return NextResponse.json({ session: reviewSession, assignments });
}
