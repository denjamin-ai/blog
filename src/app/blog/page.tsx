import { db } from "@/lib/db";
import { articles, users, bookmarks } from "@/lib/db/schema";
import { eq, desc, and, or, isNull, inArray, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ArticleCard } from "@/components/article-card";
import { estimateReadingTime } from "@/lib/reading-time";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Статьи",
  description:
    "Все статьи блога — программирование, веб-разработка и технологии.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Статьи",
    description:
      "Все статьи блога — программирование, веб-разработка и технологии.",
    type: "website" as const,
    url: "/blog",
  },
};

export default async function BlogPage() {
  const session = await getSession();

  const allArticles = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      content: articles.content,
      coverImageUrl: articles.coverImageUrl,
      difficulty: articles.difficulty,
      viewCount: articles.viewCount,
      rating: sql<number>`(SELECT COALESCE(SUM(value), 0) FROM article_votes WHERE article_id = articles.id)`,
      bookmarkCount: sql<number>`(SELECT COUNT(*) FROM bookmarks WHERE article_id = articles.id)`,
      authorName: users.displayName,
      authorSlug: users.slug,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, "published"),
        or(isNull(articles.authorId), eq(users.isBlocked, 0)),
      ),
    )
    .orderBy(desc(articles.publishedAt));

  // Fetch user's bookmarked article IDs (only for logged-in readers)
  let userBookmarkedIds = new Set<string>();
  if (session.userId && allArticles.length > 0) {
    const ids = allArticles.map((a) => a.id);
    const userBookmarks = await db
      .select({ articleId: bookmarks.articleId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.userId),
          inArray(bookmarks.articleId, ids),
        ),
      );
    userBookmarkedIds = new Set(userBookmarks.map((b) => b.articleId));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mb-12">
        Статьи
      </h1>

      {allArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-muted-foreground/40 mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="text-muted-foreground">Статьи скоро появятся.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {allArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              index={i}
              id={article.id}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              tags={article.tags}
              publishedAt={article.publishedAt}
              coverImageUrl={article.coverImageUrl}
              difficulty={article.difficulty}
              viewCount={article.viewCount}
              readingTime={estimateReadingTime(article.content)}
              rating={article.rating}
              bookmarked={userBookmarkedIds.has(article.id)}
              bookmarkCount={article.bookmarkCount}
              authorName={article.authorName}
              authorSlug={article.authorSlug}
              authorAvatarUrl={article.authorAvatarUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
