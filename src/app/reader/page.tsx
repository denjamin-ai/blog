import { db } from "@/lib/db";
import { articles, subscriptions, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Моя лента",
};

export default async function ReaderHomePage() {
  const session = await requireUser("reader");

  // Статьи от авторов, на которых подписан читатель
  const feed = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      coverImageUrl: articles.coverImageUrl,
      difficulty: articles.difficulty,
      viewCount: articles.viewCount,
      authorName: users.displayName,
      authorSlug: users.slug,
    })
    .from(subscriptions)
    .innerJoin(articles, eq(articles.authorId, subscriptions.authorId))
    .innerJoin(users, eq(users.id, subscriptions.authorId))
    .where(
      and(
        eq(subscriptions.userId, session.userId!),
        eq(articles.status, "published"),
        eq(users.isBlocked, 0),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(20);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Моя лента</h1>
        <div className="flex gap-4 text-sm">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Все статьи
          </Link>
          <Link
            href="/bookmarks"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Закладки
          </Link>
          <Link
            href="/notifications"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Уведомления
          </Link>
        </div>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-2">Лента пуста.</p>
          <p className="text-sm text-muted-foreground">
            Подпишитесь на авторов на странице статьи, чтобы видеть их
            публикации здесь.
          </p>
          <Link
            href="/blog"
            className="inline-block mt-4 text-sm text-accent hover:underline"
          >
            Перейти к статьям →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((article) => (
            <div key={article.id}>
              {article.authorName && (
                <div className="mb-1.5 text-xs text-muted-foreground">
                  {article.authorSlug ? (
                    <Link
                      href={`/authors/${article.authorSlug}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {article.authorName}
                    </Link>
                  ) : (
                    article.authorName
                  )}
                </div>
              )}
              <ArticleCard
                slug={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                tags={article.tags}
                publishedAt={article.publishedAt}
                coverImageUrl={article.coverImageUrl}
                difficulty={article.difficulty}
                viewCount={article.viewCount ?? 0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
