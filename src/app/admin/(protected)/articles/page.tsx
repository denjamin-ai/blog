import { db } from "@/lib/db";
import { articles, users, reviewAssignments } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import UnpublishButton from "./unpublish-button";
import { VerdictBadge } from "@/components/review/verdict-badge";
import { ArticleFilterTabs } from "./articles-filter-tabs";
import { ScheduleActionsButton } from "./schedule-actions-button";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  published: "Опубликовано",
  draft: "Черновик",
  scheduled: "Запланировано",
};

const STATUS_CLASSES: Record<string, string> = {
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: statusFilter } = await searchParams;
  const validStatuses = ["draft", "published", "scheduled"];
  const filter =
    statusFilter && validStatuses.includes(statusFilter) ? statusFilter : "";

  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      scheduledAt: articles.scheduledAt,
      updatedAt: articles.updatedAt,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.updatedAt));

  const filtered = filter
    ? allArticles.filter((a) => a.status === filter)
    : allArticles;

  // Fetch latest completed assignment verdict per article
  const verdictMap: Record<string, string | null> = {};
  await Promise.all(
    filtered.map(async (article) => {
      const latest = await db
        .select({ verdict: reviewAssignments.verdict })
        .from(reviewAssignments)
        .where(
          and(
            eq(reviewAssignments.articleId, article.id),
            eq(reviewAssignments.status, "completed"),
          ),
        )
        .orderBy(desc(reviewAssignments.updatedAt))
        .limit(1)
        .get();
      verdictMap[article.id] = latest?.verdict ?? null;
    }),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Статьи</h1>
      </div>

      <div className="mb-4">
        <Suspense>
          <ArticleFilterTabs current={filter} />
        </Suspense>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">Статей пока нет.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Автор</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Ревью</th>
                <th className="px-4 py-3 font-medium">Обновлено</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => (
                <tr
                  key={article.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {article.authorName ?? (
                      <span className="italic">Администратор</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_CLASSES[article.status] ?? STATUS_CLASSES.draft
                        }`}
                      >
                        {STATUS_LABELS[article.status] ?? article.status}
                      </span>
                      {article.status === "scheduled" &&
                        article.scheduledAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              article.scheduledAt * 1000,
                            ).toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {verdictMap[article.id] ? (
                      <Link href={`/admin/articles/${article.id}/review`}>
                        <VerdictBadge verdict={verdictMap[article.id]} />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(article.updatedAt * 1000).toLocaleDateString(
                      "ru-RU",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Редактировать
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}/history`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        История
                      </Link>
                      {article.status === "published" && (
                        <UnpublishButton articleId={article.id} />
                      )}
                      {article.status === "scheduled" && (
                        <ScheduleActionsButton articleId={article.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
