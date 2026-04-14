import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id: authorId } = await params;

  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      publishedAt: articles.publishedAt,
      viewCount: articles.viewCount,
    })
    .from(articles)
    .where(eq(articles.authorId, authorId))
    .orderBy(desc(articles.createdAt));

  return NextResponse.json(rows);
}
