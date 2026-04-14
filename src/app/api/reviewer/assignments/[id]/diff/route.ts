import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, articleVersions, articles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    .select({ content: articleVersions.content })
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  const article = await db
    .select({ content: articles.content })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  if (!version || !article) {
    return NextResponse.json({ error: "Данные не найдены" }, { status: 404 });
  }

  return NextResponse.json({
    old: version.content,
    new: article.content,
    hasChanges: version.content !== article.content,
  });
}
