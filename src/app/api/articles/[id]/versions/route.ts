import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, articleVersions, reviewAssignments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, lte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  // ?full=1 includes content field in response
  const full = searchParams.get("full") === "1";

  const session = await getSession();

  if (!session.isAdmin) {
    if (!session.userId || session.userRole !== "reviewer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId обязателен для ревьера" },
        { status: 400 },
      );
    }

    const assignment = await db
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentId))
      .get();

    if (
      !assignment ||
      assignment.reviewerId !== session.userId ||
      assignment.articleId !== id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the timestamp of the assigned version to cap the history
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
          eq(articleVersions.articleId, id),
          lte(articleVersions.createdAt, assignedVersion.createdAt),
        ),
      )
      .orderBy(desc(articleVersions.createdAt));

    return NextResponse.json(
      full ? rows : rows.map(({ content: _c, ...rest }) => rest),
    );
  }

  // Admin path
  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.articleId, id))
    .orderBy(desc(articleVersions.createdAt));

  return NextResponse.json(
    full ? rows : rows.map(({ content: _c, ...rest }) => rest),
  );
}
