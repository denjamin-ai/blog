import { db } from "@/lib/db";
import { users, articles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { parseTags } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await db
    .select({
      displayName: users.displayName,
      name: users.name,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(eq(users.slug, slug), eq(users.isBlocked, 0)))
    .get();

  if (!author) return {};

  const displayName = author.displayName ?? author.name;
  const ogImage = author.avatarUrl ? [{ url: author.avatarUrl }] : undefined;

  return {
    title: displayName,
    description: author.bio ?? undefined,
    openGraph: {
      title: displayName,
      description: author.bio ?? undefined,
      images: ogImage,
    },
  };
}

export default async function AuthorPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const author = await db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      links: users.links,
      isBlocked: users.isBlocked,
    })
    .from(users)
    .where(eq(users.slug, slug))
    .get();

  if (!author || author.isBlocked) {
    notFound();
  }

  let links: Record<string, string> = {};
  try {
    if (author.links) links = JSON.parse(author.links);
  } catch {
    links = {};
  }

  const authorArticles = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      coverImageUrl: articles.coverImageUrl,
    })
    .from(articles)
    .where(
      and(eq(articles.authorId, author.id), eq(articles.status, "published")),
    )
    .orderBy(desc(articles.publishedAt));

  const displayName = author.displayName ?? author.name;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Шапка профиля */}
      <div className="flex items-start gap-6 mb-10">
        {author.avatarUrl ? (
          <Image
            src={author.avatarUrl}
            alt={displayName}
            width={96}
            height={96}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted border border-border flex items-center justify-center text-3xl font-bold text-muted-foreground shrink-0">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          {author.bio && (
            <p className="mt-2 text-muted-foreground max-w-prose">
              {author.bio}
            </p>
          )}
          {Object.keys(links).length > 0 && (
            <div className="flex gap-4 mt-3 text-sm">
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  GitHub
                </a>
              )}
              {links.telegram && (
                <a
                  href={links.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Telegram
                </a>
              )}
              {links.website && (
                <a
                  href={links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Сайт
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Статьи автора */}
      <section>
        <h2 className="text-xl font-semibold mb-6">
          Статьи
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({authorArticles.length})
          </span>
        </h2>

        {authorArticles.length === 0 ? (
          <p className="text-muted-foreground">Статей пока нет.</p>
        ) : (
          <div className="space-y-6">
            {authorArticles.map((article) => {
              const tags = parseTags(article.tags);
              return (
                <article
                  key={article.id}
                  className="border-b border-border pb-6 last:border-0"
                >
                  <Link href={`/blog/${article.slug}`} className="group block">
                    <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                  {article.excerpt && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {article.publishedAt && (
                      <span>
                        {new Date(
                          article.publishedAt * 1000,
                        ).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {tags.length > 0 && (
                      <span className="flex gap-1">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-muted rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
