import { db } from "@/lib/db";
import {
  articles,
  bookmarks,
  publicComments,
  articleVotes,
} from "@/lib/db/schema";
import { count, sum, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    countsByStatus,
    viewTotalRow,
    bookmarkTotalRow,
    commentTotalRow,
    topByViews,
    topByVotes,
  ] = await Promise.all([
    db
      .select({ status: articles.status, count: count() })
      .from(articles)
      .groupBy(articles.status),
    db
      .select({ total: sum(articles.viewCount) })
      .from(articles)
      .get(),
    db.select({ total: count() }).from(bookmarks).get(),
    db
      .select({ total: count() })
      .from(publicComments)
      .where(isNull(publicComments.deletedAt))
      .get(),
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        viewCount: articles.viewCount,
      })
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.viewCount))
      .limit(5),
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        voteSum: sum(articleVotes.value),
      })
      .from(articleVotes)
      .innerJoin(articles, eq(articleVotes.articleId, articles.id))
      .where(eq(articles.status, "published"))
      .groupBy(articles.id)
      .orderBy(desc(sum(articleVotes.value)))
      .limit(5),
  ]);

  const published =
    countsByStatus.find((r) => r.status === "published")?.count ?? 0;
  const draft = countsByStatus.find((r) => r.status === "draft")?.count ?? 0;
  const scheduled =
    countsByStatus.find((r) => r.status === "scheduled")?.count ?? 0;
  const total = countsByStatus.reduce((s, r) => s + r.count, 0);

  const articleStats = [
    { label: "Всего статей", value: total, href: "/admin/articles" },
    {
      label: "Опубликовано",
      value: published,
      href: "/admin/articles?status=published",
    },
    { label: "Черновики", value: draft, href: "/admin/articles?status=draft" },
    {
      label: "Запланировано",
      value: scheduled,
      href: "/admin/articles?status=scheduled",
    },
  ];

  const engagementStats = [
    { label: "Просмотры", value: Number(viewTotalRow?.total ?? 0) },
    { label: "Закладки", value: bookmarkTotalRow?.total ?? 0 },
    { label: "Комментарии", value: commentTotalRow?.total ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Новая статья
        </Link>
      </div>

      {/* Article counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {articleStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="p-5 border border-border rounded-xl shadow-sm hover:bg-muted/50 transition-colors"
          >
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Engagement metrics */}
      <div>
        <h2 className="text-base font-semibold mb-3">Вовлечённость</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {engagementStats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 border border-border rounded-xl shadow-sm"
            >
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-semibold mb-3">Топ-5 по просмотрам</h2>
          {topByViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ol className="space-y-2">
              {topByViews.map((article, i) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-muted-foreground text-sm w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium flex-1 truncate group-hover:text-accent transition-colors">
                      {article.title}
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {article.viewCount ?? 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Топ-5 по рейтингу</h2>
          {topByVotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ol className="space-y-2">
              {topByVotes.map((article, i) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-muted-foreground text-sm w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium flex-1 truncate group-hover:text-accent transition-colors">
                      {article.title}
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {Number(article.voteSum ?? 0) > 0 ? "+" : ""}
                      {Number(article.voteSum ?? 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
