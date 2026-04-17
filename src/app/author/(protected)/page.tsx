import { requireAuthor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  articles,
  articleVotes,
  bookmarks as bookmarksTable,
  reviewAssignments,
} from "@/lib/db/schema";
import { eq, and, or, sql, sum, count, inArray } from "drizzle-orm";
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
  let articlesInReview = 0;

  if (articleIds.length > 0) {
    const reviewRows = await db
      .selectDistinct({ articleId: reviewAssignments.articleId })
      .from(reviewAssignments)
      .where(
        and(
          inArray(reviewAssignments.articleId, articleIds),
          or(
            eq(reviewAssignments.status, "pending"),
            eq(reviewAssignments.status, "accepted"),
          ),
        ),
      );
    articlesInReview = reviewRows.length;
  }

  if (articleIds.length > 0) {
    const [bookmarkRow, ratingRow] = await Promise.all([
      db
        .select({ total: count() })
        .from(bookmarksTable)
        .where(inArray(bookmarksTable.articleId, articleIds))
        .get(),
      db
        .select({ total: sum(articleVotes.value) })
        .from(articleVotes)
        .where(inArray(articleVotes.articleId, articleIds))
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
        <div className="flex gap-2">
          <Link
            href="/author/articles/new"
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Написать статью
          </Link>
          <Link
            href="/author/articles"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Все мои статьи
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-elevated border border-border rounded-xl p-5"
          >
            <div className="text-3xl font-display font-bold mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {articlesInReview > 0 && (
        <Link
          href="/author/articles?filter=review"
          className="block mb-8 rounded-xl border border-warning/30 bg-warning-bg/30 p-5 hover:border-warning/60 hover:bg-warning-bg/50 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-warning mb-1">
                На ревью
              </div>
              <div className="text-2xl font-display font-bold text-foreground">
                {articlesInReview}{" "}
                {articlesInReview === 1
                  ? "статья"
                  : articlesInReview < 5
                    ? "статьи"
                    : "статей"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Ждут вашего внимания — откройте, чтобы увидеть замечания
              </div>
            </div>
            <div className="text-accent text-2xl">→</div>
          </div>
        </Link>
      )}
    </div>
  );
}
