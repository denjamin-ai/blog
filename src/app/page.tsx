import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { articles, users, profile } from "@/lib/db/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { ArticleCard } from "@/components/article-card";
import { estimateReadingTime } from "@/lib/reading-time";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [row] = await db
    .select({
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    })
    .from(profile)
    .where(eq(profile.id, "main"))
    .limit(1);

  const title = row?.name ?? "devblog";
  const description = row?.bio ?? "Персональный блог разработчика";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(row?.avatarUrl ? { images: [{ url: row.avatarUrl }] } : {}),
    },
  };
}

export default async function Home() {
  const session = await getSession();

  if (session.isAdmin) redirect("/admin");
  if (session.userRole === "author") redirect("/author");
  if (session.userRole === "reviewer") redirect("/reviewer");
  if (session.userRole === "reader") redirect("/reader");

  // Guest — editorial homepage
  const [profileRow, recentArticles] = await Promise.all([
    db
      .select({
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      })
      .from(profile)
      .where(eq(profile.id, "main"))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
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
        content: articles.content,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        and(
          eq(articles.status, "published"),
          or(isNull(articles.authorId), eq(users.isBlocked, 0)),
        ),
      )
      .orderBy(desc(articles.publishedAt))
      .limit(3),
  ]);

  const [featured, ...rest] = recentArticles;

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 md:py-28 flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            {profileRow?.name || "devblog"}
          </h1>
          {profileRow?.bio && (
            <p className="text-lg font-light text-muted-foreground max-w-xl leading-relaxed">
              {profileRow.bio}
            </p>
          )}
        </div>
        {profileRow?.avatarUrl && (
          <div className="flex-shrink-0 self-start md:self-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileRow.avatarUrl}
              alt={profileRow.name || "Автор"}
              className="w-36 h-48 md:w-44 md:h-60 object-cover rounded-sm"
            />
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* Featured article */}
      {featured && (
        <section className="py-12">
          <Link
            href={`/blog/${featured.slug}`}
            className="group flex flex-col md:flex-row border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors"
          >
            {featured.coverImageUrl && (
              <div className="relative w-full md:w-72 h-52 md:h-auto flex-shrink-0">
                <Image
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 288px"
                  priority
                />
              </div>
            )}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-3 group-hover:text-accent transition-colors leading-snug">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {featured.excerpt}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {featured.publishedAt && (
                  <span>
                    {new Date(featured.publishedAt * 1000).toLocaleDateString(
                      "ru-RU",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </span>
                )}
                <span>{estimateReadingTime(featured.content)} мин чтения</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Remaining articles */}
      {rest.length > 0 && (
        <>
          <hr className="border-border" />
          <section className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rest.map((article, i) => (
                <ArticleCard
                  key={article.id}
                  index={i}
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
          </section>
        </>
      )}

      <hr className="border-border" />

      <div className="py-10 text-center">
        <Link
          href="/blog"
          className="font-medium text-accent hover:underline underline-offset-4 transition-colors"
        >
          Все статьи →
        </Link>
      </div>
    </div>
  );
}
