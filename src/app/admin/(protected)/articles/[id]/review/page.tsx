import { db } from "@/lib/db";
import { articles, reviewAssignments, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerdictBadge } from "@/components/review/verdict-badge";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ArticleReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const article = await db
    .select({ id: articles.id, title: articles.title })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) notFound();

  const assignments = await db
    .select({
      id: reviewAssignments.id,
      status: reviewAssignments.status,
      verdict: reviewAssignments.verdict,
      verdictNote: reviewAssignments.verdictNote,
      createdAt: reviewAssignments.createdAt,
      reviewerName: users.name,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(eq(reviewAssignments.articleId, id))
    .orderBy(desc(reviewAssignments.createdAt));

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link
          href={`/admin/articles/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Назад к статье
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Ревью</h1>
      <p className="text-muted-foreground text-sm mb-6">{article.title}</p>

      {assignments.length === 0 ? (
        <p className="text-muted-foreground">
          Назначений на ревью пока нет.{" "}
          <Link
            href={`/admin/articles/${id}`}
            className="text-accent hover:underline"
          >
            Отправить на ревью →
          </Link>
        </p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/admin/articles/${id}/review/${a.id}`}
              className="block rounded-lg border border-border p-4 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {a.reviewerName ?? "Ревьюер"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.verdict && <VerdictBadge verdict={a.verdict} />}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
              </div>
              {a.verdictNote && (
                <p className="mt-2 text-xs text-muted-foreground italic truncate">
                  {a.verdictNote}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
