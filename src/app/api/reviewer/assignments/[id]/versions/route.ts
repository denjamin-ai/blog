import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, articleVersions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc, lte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (err) {
    if (err instanceof Response) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const { id } = await params;

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment || assignment.reviewerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignedVersion = await db
    .select({ createdAt: articleVersions.createdAt })
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  if (!assignedVersion) {
    return NextResponse.json(
      { error: "Версия назначения не найдена" },
      { status: 500 },
    );
  }

  const rows = await db
    .select()
    .from(articleVersions)
    .where(
      and(
        eq(articleVersions.articleId, assignment.articleId),
        lte(articleVersions.createdAt, assignedVersion.createdAt),
      ),
    )
    .orderBy(desc(articleVersions.createdAt));

  // Return metadata only — no content field
  return NextResponse.json(rows.map(({ content: _c, ...rest }) => rest));
}
