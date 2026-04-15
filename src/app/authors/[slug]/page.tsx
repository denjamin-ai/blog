import { db } from "@/lib/db";
import { users, articles, subscriptions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ArticleCard } from "@/components/article-card";
import { SubscribeButton } from "@/components/subscribe-button";
import { estimateReadingTime } from "@/lib/reading-time";
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

  const session = await getSession();

  const [authorArticles, subExisting] = await Promise.all([
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
      .where(
        and(eq(articles.authorId, author.id), eq(articles.status, "published")),
      )
      .orderBy(desc(articles.publishedAt)),
    session.userId
      ? db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, session.userId),
              eq(subscriptions.authorId, author.id),
            ),
          )
          .get()
      : Promise.resolve(null),
  ]);

  const displayName = author.displayName ?? author.name;
  const initialSubscribed = !!subExisting;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Author profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover border-2 border-border flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center text-3xl font-bold text-muted-foreground flex-shrink-0">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">
            {displayName}
          </h1>
          {author.bio && (
            <p className="mt-2 text-muted-foreground max-w-prose leading-relaxed">
              {author.bio}
            </p>
          )}

          {/* Social links + subscribe */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {links.github && (
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                title="GitHub"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            )}
            {links.telegram && (
              <a
                href={links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                title="Telegram"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            )}
            {links.website && (
              <a
                href={links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                title="Сайт"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            )}

            <SubscribeButton
              authorId={author.id}
              authorName={displayName}
              initialSubscribed={initialSubscribed}
            />
          </div>
        </div>
      </div>

      <hr className="border-border mb-10" />

      {/* Author's articles */}
      <section>
        <h2 className="font-display font-bold text-2xl mb-8">
          Статьи
          <span className="ml-2 text-lg font-normal text-muted-foreground">
            ({authorArticles.length})
          </span>
        </h2>

        {authorArticles.length === 0 ? (
          <p className="text-muted-foreground">Статей пока нет.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {authorArticles.map((article) => (
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
      </section>
    </div>
  );
}
