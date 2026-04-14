import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: articleId } = await params;
  const session = await getSession();

  const [totalRow] = await Promise.all([
    db
      .select({ total: count() })
      .from(bookmarks)
      .where(eq(bookmarks.articleId, articleId))
      .get(),
  ]);

  let bookmarked = false;
  if (session.userId) {
    const existing = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.userId),
          eq(bookmarks.articleId, articleId),
        ),
      )
      .get();
    bookmarked = !!existing;
  }

  return NextResponse.json({
    bookmarked,
    count: totalRow?.total ?? 0,
  });
}
