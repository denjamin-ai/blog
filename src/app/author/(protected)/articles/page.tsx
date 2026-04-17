import { requireAuthor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  articles,
  reviewAssignments,
  reviewComments,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, or, inArray, isNull, ne, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AuthorArticlesPage({ searchParams }: PageProps) {
  const session = await requireAuthor();
  const { filter } = await searchParams;
  const onlyReview = filter === "review";

  const myArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.authorId, session.userId!))
    .orderBy(desc(articles.updatedAt));

  const articleIds = myArticles.map((a) => a.id);

  type ReviewItem = {
    articleId: string;
    title: string;
    reviewerCount: number;
    openComments: number;
  };
  let reviewItems: ReviewItem[] = [];

  if (articleIds.length > 0) {
    const activeAssignments = await db
      .select({
        id: reviewAssignments.id,
        articleId: reviewAssignments.articleId,
        reviewerName: users.name,
        reviewerId: reviewAssignments.reviewerId,
      })
      .from(reviewAssignments)
      .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
      .where(
        and(
          inArray(reviewAssignments.articleId, articleIds),
          or(
            eq(reviewAssignments.status, "pending"),
            eq(reviewAssignments.status, "accepted"),
            eq(reviewAssignments.status, "completed"),
          ),
        ),
      );

    const assignmentIds = activeAssignments.map((a) => a.id);

    let openCommentsByArticle = new Map<string, number>();
    if (assignmentIds.length > 0) {
      const openRows = await db
        .select({
          articleId: reviewAssignments.articleId,
          cnt: sql<number>`count(*)`,
        })
        .from(reviewComments)
        .innerJoin(
          reviewAssignments,
          eq(reviewComments.assignmentId, reviewAssignments.id),
        )
        .where(
          and(
            inArray(reviewAssignments.id, assignmentIds),
            isNull(reviewComments.batchId),
            isNull(reviewComments.resolvedAt),
            ne(reviewComments.authorId, session.userId!),
          ),
        )
        .groupBy(reviewAssignments.articleId);

      openCommentsByArticle = new Map(
        openRows.map((r) => [r.articleId, Number(r.cnt)]),
      );
    }

    const byArticle = new Map<
      string,
      { reviewerIds: Set<string>; title: string }
    >();
    for (const a of activeAssignments) {
      const article = myArticles.find((x) => x.id === a.articleId);
      if (!article) continue;
      const existing =
        byArticle.get(a.articleId) ?? {
          reviewerIds: new Set<string>(),
          title: article.title,
        };
      if (a.reviewerId) existing.reviewerIds.add(a.reviewerId);
      byArticle.set(a.articleId, existing);
    }

    reviewItems = Array.from(byArticle.entries()).map(([articleId, data]) => ({
      articleId,
      title: data.title,
      reviewerCount: data.reviewerIds.size,
      openComments: openCommentsByArticle.get(articleId) ?? 0,
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {onlyReview ? "Статьи на ревью" : "Мои статьи"}
        </h1>
        <div className="flex gap-2 items-center">
          {onlyReview && (
            <Link
              href="/author/articles"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Показать все
            </Link>
          )}
          <Link
            href="/author/articles/new"
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Новая статья
          </Link>
        </div>
      </div>

      {reviewItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            На ревью
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {reviewItems.map((item) => (
              <Link
                key={item.articleId}
                href={`/author/articles/${item.articleId}/review`}
                className="block rounded-xl border border-warning/30 bg-warning-bg/20 p-4 hover:border-warning/60 hover:bg-warning-bg/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.reviewerCount}{" "}
                      {item.reviewerCount === 1
                        ? "ревьюер"
                        : item.reviewerCount < 5
                          ? "ревьюера"
                          : "ревьюеров"}
                    </p>
                  </div>
                  {item.openComments > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning border border-warning/30">
                      {item.openComments}{" "}
                      {item.openComments === 1
                        ? "замечание"
                        : item.openComments < 5
                          ? "замечания"
                          : "замечаний"}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {onlyReview ? null : myArticles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">У вас пока нет статей.</p>
          <Link
            href="/author/articles/new"
            className="text-accent hover:underline"
          >
            Написать первую статью
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Обновлено</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {myArticles.map((article) => (
                <tr
                  key={article.id}
                  className="border-t border-border hover:bg-elevated transition-colors even:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/author/articles/${article.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        article.status === "published"
                          ? "bg-success-bg text-success"
                          : "bg-warning-bg text-warning"
                      }`}
                    >
                      {article.status === "published"
                        ? "Опубликовано"
                        : "Черновик"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(article.updatedAt * 1000).toLocaleDateString(
                      "ru-RU",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/author/articles/${article.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Редактировать
                      </Link>
                      <Link
                        href={`/author/articles/${article.id}/history`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        История
                      </Link>
                      <Link
                        href={`/author/articles/${article.id}/review`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Ревью
                      </Link>
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
