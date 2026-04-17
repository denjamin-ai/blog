import { db } from "@/lib/db";
import {
  articles,
  reviewAssignments,
  articleVersions,
  users,
} from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { compileMDX } from "@/lib/mdx";
import { AuthorReviewView } from "./author-review-view";

export const dynamic = "force-dynamic";

export default async function AuthorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const session = await requireAuthor();
  const { id, assignmentId } = await params;

  // Verify article ownership
  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      authorId: articles.authorId,
      content: articles.content,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article || article.authorId !== session.userId) notFound();

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

  // Compile current article content for inline review
  const content = await compileMDX(article.content, { reviewMode: true });

  return (
    <AuthorReviewView
      assignmentId={assignmentId}
      assignmentStatus={assignment.status as "pending" | "accepted" | "declined" | "completed"}
      articleTitle={article.title}
      reviewerName={assignment.reviewerName ?? "Ревьюер"}
      verdict={assignment.verdict}
      verdictNote={assignment.verdictNote}
      currentUserId={session.userId ?? null}
      backHref={`/author/articles/${id}/review`}
    >
      {content}
    </AuthorReviewView>
  );
}
