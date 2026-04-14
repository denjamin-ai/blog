import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, articleVersions, articles } from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthor();
  const { id } = await params;

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Проверяем, что статья принадлежит этому автору
  const article = await db
    .select({ content: articles.content, authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  if (!article || article.authorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const version = await db
    .select({ content: articleVersions.content })
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  if (!version) {
    return NextResponse.json({ error: "Данные не найдены" }, { status: 404 });
  }

  return NextResponse.json({
    old: version.content,
    new: article.content,
    hasChanges: version.content !== article.content,
  });
}
