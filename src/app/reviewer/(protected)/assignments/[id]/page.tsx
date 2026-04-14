import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewAssignments, articleVersions, articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compileMDX } from "@/lib/mdx";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ReviewAssignmentView } from "./review-view";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (err) {
    if (err instanceof Response) redirect("/login");
    throw err;
  }

  const { id } = await params;

  const assignment = await db
    .select()
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment || assignment.reviewerId !== session.userId) {
    notFound();
  }

  const version = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  if (!version) {
    notFound();
  }

  const article = await db
    .select({ title: articles.title })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  const content = await compileMDX(version.content);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Link
          href={`/reviewer/assignments/${id}/versions`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          История версий
        </Link>
      </div>
      <ReviewAssignmentView
        assignmentId={id}
        status={assignment.status}
        articleTitle={article?.title ?? version.title}
      >
        {content}
      </ReviewAssignmentView>
    </>
  );
}
