import { db } from "@/lib/db";
import { bookmarks, articles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { ArticleCard } from "@/components/article-card";
import { estimateReadingTime } from "@/lib/reading-time";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const session = await requireUser("reader");

  const rows = await db
    .select({
      bookmarkId: bookmarks.id,
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      coverImageUrl: articles.coverImageUrl,
      difficulty: articles.difficulty,
      viewCount: articles.viewCount,
      content: articles.content,
    })
    .from(bookmarks)
    .innerJoin(articles, eq(bookmarks.articleId, articles.id))
    .where(eq(bookmarks.userId, session.userId!))
    .orderBy(desc(bookmarks.createdAt));

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-display font-extrabold text-4xl tracking-tight mb-10">
        Мои закладки
      </h1>

      {rows.length === 0 ? (
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
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-muted-foreground">У вас пока нет закладок</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {rows.map((row, i) => (
            <ArticleCard
              key={row.bookmarkId}
              index={i}
              id={row.id}
              slug={row.slug}
              title={row.title}
              excerpt={row.excerpt}
              tags={row.tags}
              publishedAt={row.publishedAt}
              coverImageUrl={row.coverImageUrl}
              difficulty={row.difficulty}
              viewCount={row.viewCount}
              readingTime={estimateReadingTime(row.content)}
              bookmarked={true}
              bookmarkCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
