import { requireAuthor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  articles,
  articleVotes,
  bookmarks as bookmarksTable,
} from "@/lib/db/schema";
import { eq, and, sql, sum, count } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuthorDashboard() {
  const session = await requireAuthor();

  const [total, published, drafts, authorArticles] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.authorId, session.userId!))
      .get(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(
        and(
          eq(articles.authorId, session.userId!),
          eq(articles.status, "published"),
        ),
      )
      .get(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(
        and(
          eq(articles.authorId, session.userId!),
          eq(articles.status, "draft"),
        ),
      )
      .get(),
    db
      .select({ id: articles.id, viewCount: articles.viewCount })
      .from(articles)
      .where(eq(articles.authorId, session.userId!)),
  ]);

  const articleIds = authorArticles.map((a) => a.id);
  const totalViews = authorArticles.reduce((acc, a) => acc + a.viewCount, 0);

  let totalBookmarks = 0;
  let avgRating = 0;

  if (articleIds.length > 0) {
    const [bookmarkRow, ratingRow] = await Promise.all([
      db
        .select({ total: count() })
        .from(bookmarksTable)
        .where(
          sql`${bookmarksTable.articleId} IN (${sql.join(
            articleIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .get(),
      db
        .select({ total: sum(articleVotes.value) })
        .from(articleVotes)
        .where(
          sql`${articleVotes.articleId} IN (${sql.join(
            articleIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .get(),
    ]);

    totalBookmarks = bookmarkRow?.total ?? 0;
    const ratingSum = Number(ratingRow?.total ?? 0);
    avgRating =
      articleIds.length > 0
        ? Math.round((ratingSum / articleIds.length) * 10) / 10
        : 0;
  }

  const stats = [
    { label: "Всего статей", value: total?.count ?? 0 },
    { label: "Опубликовано", value: published?.count ?? 0 },
    { label: "Черновиков", value: drafts?.count ?? 0 },
    { label: "Просмотров", value: totalViews },
    { label: "Закладок", value: totalBookmarks },
    {
      label: "Средний рейтинг",
      value: avgRating > 0 ? `+${avgRating}` : avgRating,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Обзор</h1>
        <Link
          href="/author/articles/new"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Написать статью
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border rounded-lg p-6 bg-muted/20 shadow-sm"
          >
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/author/articles"
          className="text-sm text-accent hover:underline"
        >
          Все мои статьи &rarr;
        </Link>
        <Link
          href="/author/notifications"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Уведомления &rarr;
        </Link>
      </div>
    </div>
  );
}
