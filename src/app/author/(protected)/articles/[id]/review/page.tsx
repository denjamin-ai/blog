import { db } from "@/lib/db";
import { articles, reviewAssignments, users } from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "@/lib/mdx";
import { UnifiedReviewView } from "./unified-review-view";
import type { AssignmentStatus } from "@/components/review/review-context";

export const dynamic = "force-dynamic";

export default async function AuthorReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuthor();
  const { id } = await params;

  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
      authorId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article || article.authorId !== session.userId) notFound();

  const assignments = await db
    .select({
      id: reviewAssignments.id,
      status: reviewAssignments.status,
      reviewerName: users.name,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(eq(reviewAssignments.articleId, id))
    .orderBy(desc(reviewAssignments.createdAt));

  // Пустое состояние — нет ни одного назначения
  if (assignments.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Link
            href={`/author/articles/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Назад к статье
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">Ревью</h1>
        <p className="text-muted-foreground text-sm mb-6">{article.title}</p>
        <p className="text-muted-foreground">
          Назначений на ревью пока нет.{" "}
          <Link
            href={`/author/articles/${id}`}
            className="text-accent hover:underline"
          >
            Отправить на ревью →
          </Link>
        </p>
      </div>
    );
  }

  const content = await compileMDX(article.content, { reviewMode: true });

  return (
    <UnifiedReviewView
      articleId={article.id}
      articleTitle={article.title}
      assignments={assignments.map((a) => ({
        id: a.id,
        reviewerName: a.reviewerName ?? "Ревьюер",
        status: a.status as AssignmentStatus,
      }))}
      currentUserId={session.userId ?? null}
      backHref={`/author/articles/${id}`}
    >
      {content}
    </UnifiedReviewView>
  );
}
