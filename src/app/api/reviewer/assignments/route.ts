import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, articles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (res) {
    if (!(res instanceof Response)) throw res;
    return res;
  }

  const rows = await db
    .select({
      id: reviewAssignments.id,
      articleId: reviewAssignments.articleId,
      articleVersionId: reviewAssignments.articleVersionId,
      status: reviewAssignments.status,
      reviewerNote: reviewAssignments.reviewerNote,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
      articleTitle: articles.title,
    })
    .from(reviewAssignments)
    .leftJoin(articles, eq(reviewAssignments.articleId, articles.id))
    .where(eq(reviewAssignments.reviewerId, session.userId!))
    .orderBy(desc(reviewAssignments.createdAt));

  return NextResponse.json(rows);
}
