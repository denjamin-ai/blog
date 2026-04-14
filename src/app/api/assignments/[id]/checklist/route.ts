import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewChecklists, articles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Доступ: admin — всегда; reviewer — только свои; author — только свои статьи
  if (!session.isAdmin) {
    if (session.userRole === "reviewer") {
      if (assignment.reviewerId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.userRole === "author") {
      const article = await db
        .select({ authorId: articles.authorId })
        .from(articles)
        .where(eq(articles.id, assignment.articleId))
        .get();
      if (!article || article.authorId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const checklist = await db
    .select()
    .from(reviewChecklists)
    .where(eq(reviewChecklists.assignmentId, id))
    .get();

  if (!checklist) {
    return NextResponse.json({ items: [] });
  }

  let items: { text: string; checked: boolean }[] = [];
  try {
    items = JSON.parse(checklist.items);
  } catch {
    items = [];
  }

  return NextResponse.json({ id: checklist.id, assignmentId: id, items });
}
