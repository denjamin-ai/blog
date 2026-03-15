import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ArticleCard } from "@/components/article-card";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .all();

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
            />
          ))}
        </div>
      )}
    </div>
  );
}
