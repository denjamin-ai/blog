import { db } from "@/lib/db";
import {
  articles,
  reviewAssignments,
  articleVersions,
  users,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { compileMDX } from "@/lib/mdx";
import { AdminReviewView } from "./admin-review-view";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  await requireAdmin();
  const { id, assignmentId } = await params;

  // Fetch article
  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) notFound();

  // Fetch assignment
  const assignment = await db
    .select({
      id: reviewAssignments.id,
      status: reviewAssignments.status,
      verdict: reviewAssignments.verdict,
      verdictNote: reviewAssignments.verdictNote,
      articleVersionId: reviewAssignments.articleVersionId,
      articleId: reviewAssignments.articleId,
      reviewerName: users.name,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(eq(reviewAssignments.id, assignmentId))
    .get();

  if (!assignment || assignment.articleId !== id) notFound();

  const version = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  if (!version) notFound();

  // Compile current article content
  const content = await compileMDX(article.content, { reviewMode: true });

  return (
    <AdminReviewView
      assignmentId={assignmentId}
      assignmentStatus={assignment.status as "pending" | "accepted" | "declined" | "completed"}
      articleTitle={article.title}
      reviewerName={assignment.reviewerName ?? "Ревьюер"}
      verdict={assignment.verdict}
      verdictNote={assignment.verdictNote}
      backHref={`/admin/articles/${id}/review`}
    >
      {content}
    </AdminReviewView>
  );
}
