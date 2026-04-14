import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewAssignments, articleVersions, articles } from "@/lib/db/schema";
import { eq, desc, lte, and } from "drizzle-orm";
import { compileMDX } from "@/lib/mdx";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { VersionsTimeline } from "./versions-timeline";

export const dynamic = "force-dynamic";

export default async function AssignmentVersionsPage({
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

  const article = await db
    .select({ title: articles.title })
    .from(articles)
    .where(eq(articles.id, assignment.articleId))
    .get();

  const assignedVersion = await db
    .select({ createdAt: articleVersions.createdAt })
    .from(articleVersions)
    .where(eq(articleVersions.id, assignment.articleVersionId))
    .get();

  if (!assignedVersion) {
    notFound();
  }

  const rows = await db
    .select()
    .from(articleVersions)
    .where(
      and(
        eq(articleVersions.articleId, assignment.articleId),
        lte(articleVersions.createdAt, assignedVersion.createdAt),
      ),
    )
    .orderBy(desc(articleVersions.createdAt));

  // Compile MDX for each version server-side
  const versions = await Promise.all(
    rows.map(async (v) => {
      const content = await compileMDX(v.content);
      const contentPreview = v.content
        .replace(/[#*`_[\]()>!|-]/g, " ")
        .trim()
        .slice(0, 200);
      return {
        id: v.id,
        title: v.title,
        createdAt: v.createdAt,
        changeNote: v.changeNote,
        contentPreview,
        isReviewVersion: v.id === assignment.articleVersionId,
        content,
      };
    }),
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/reviewer/assignments/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Назад к ревью
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">История версий</h1>
      {article && (
        <p className="text-muted-foreground text-sm mb-8">{article.title}</p>
      )}

      <VersionsTimeline versions={versions} />
    </div>
  );
}
