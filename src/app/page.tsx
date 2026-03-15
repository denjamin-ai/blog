import { db } from "@/lib/db";
import { profile, articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profileData = await db
    .select()
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();

  let links: Record<string, string> = {};
  try {
    links = profileData?.links ? JSON.parse(profileData.links) : {};
  } catch { /* malformed links */ }

  const recentArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(3)
    .all();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Profile section */}
      <section className="flex flex-col sm:flex-row items-start gap-8 mb-16">
        {profileData?.avatarUrl && (
          <img
            src={profileData.avatarUrl}
            alt={profileData.name}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-3">
            {profileData?.name || "devblog"}
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            {profileData?.bio || ""}
          </p>
          {Object.keys(links).length > 0 && (
            <div className="flex gap-4">
              {Object.entries(links).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {name}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent articles placeholder */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Последние статьи</h2>
          <Link
            href="/blog"
            className="text-sm text-accent hover:underline"
          >
            Все статьи
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <p className="text-muted-foreground">Статьи скоро появятся.</p>
        ) : (
          <div className="space-y-4">
            {recentArticles.map((article) => (
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
      </section>
    </div>
  );
}
