import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  reviewAssignments,
  reviewSessions,
  articleVersions,
  articles,
  users,
} from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
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

  // Load session participants (other reviewers in the same session)
  let sessionStatus: "open" | "completed" | "cancelled" = "open";
  let sessionParticipants: { id: string; name: string; status: string }[] = [];

  if (assignment.sessionId) {
    const reviewSession = await db
      .select()
      .from(reviewSessions)
      .where(eq(reviewSessions.id, assignment.sessionId))
      .get();

    if (reviewSession) {
      sessionStatus = reviewSession.status;
    }

    // Other assignments in the same session
    const otherAssignments = await db
      .select({
        id: reviewAssignments.id,
        reviewerName: users.name,
        status: reviewAssignments.status,
      })
      .from(reviewAssignments)
      .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
      .where(
        and(
          eq(reviewAssignments.sessionId, assignment.sessionId),
          ne(reviewAssignments.id, id),
        ),
      );

    sessionParticipants = otherAssignments.map((a) => ({
      id: a.id,
      name: a.reviewerName ?? "Ревьюер",
      status: a.status,
    }));
  }

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
        sessionId={assignment.sessionId ?? null}
        sessionStatus={sessionStatus}
        sessionParticipants={sessionParticipants}
        currentUserId={session.userId ?? null}
        status={assignment.status}
        articleTitle={article?.title ?? version.title}
      >
        {content}
      </ReviewAssignmentView>
    </>
  );
}
