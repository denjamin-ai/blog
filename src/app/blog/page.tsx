import { db } from "@/lib/db";
import { articles, users } from "@/lib/db/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { ArticleCard } from "@/components/article-card";
import { estimateReadingTime } from "@/lib/reading-time";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Блог",
  description:
    "Все статьи блога — программирование, веб-разработка и технологии.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Блог",
    description:
      "Все статьи блога — программирование, веб-разработка и технологии.",
    type: "website" as const,
    url: "/blog",
  },
};

export default async function BlogPage() {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Блог</h1>

      {allArticles.length === 0 ? (
        <p className="text-muted-foreground">Статьи скоро появятся.</p>
      ) : (
        <div className="space-y-4">
          {allArticles.map((article) => (
            <ArticleCard
              key={article.id}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              tags={article.tags}
              publishedAt={article.publishedAt}
              coverImageUrl={article.coverImageUrl}
              difficulty={article.difficulty}
              viewCount={article.viewCount}
              readingTime={estimateReadingTime(article.content)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
