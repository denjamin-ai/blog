import { db } from "@/lib/db";
import {
  articles,
  articleVersions,
  articleVotes,
  bookmarks,
  subscriptions,
  users,
  profile as profileTable,
} from "@/lib/db/schema";
import { eq, and, desc, or, isNull, sum, count } from "drizzle-orm";
import { compileMDX } from "@/lib/mdx";
import { estimateReadingTime } from "@/lib/reading-time";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CodeCopyButtons } from "@/components/mdx/copy-button";
import { parseTags, mdxToPlainText } from "@/lib/utils";
import { CommentSection } from "@/components/comments/comment-section";
import { ArticleChangelog } from "@/components/article-changelog";
import { ShareButton } from "@/components/share-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TableOfContents } from "@/components/toc";
import { BookmarkButton } from "@/components/bookmark-button";
import { ArticleVoting } from "@/components/article-voting";
import { SubscribeButton } from "@/components/subscribe-button";
import { ViewTracker } from "@/components/view-tracker";
import { ScrollProgress } from "@/components/scroll-progress";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [row, profileData] = await Promise.all([
    db
      .select({
        title: articles.title,
        content: articles.content,
        excerpt: articles.excerpt,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
        slug: articles.slug,
        authorName: users.name,
        coverImageUrl: articles.coverImageUrl,
        ogTitle: articles.ogTitle,
        ogDescription: articles.ogDescription,
        ogImage: articles.ogImage,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        and(
          eq(articles.slug, slug),
          eq(articles.status, "published"),
          or(isNull(articles.authorId), eq(users.isBlocked, 0)),
        ),
      )
      .get(),
    db
      .select({
        avatarUrl: profileTable.avatarUrl,
        defaultOgImage: profileTable.defaultOgImage,
      })
      .from(profileTable)
      .where(eq(profileTable.id, "main"))
      .get(),
  ]);

  if (!row) return {};

  const metaTitle = row.ogTitle || row.title;
  const description =
    row.ogDescription ||
    row.excerpt?.trim().slice(0, 155) ||
    mdxToPlainText(row.content) ||
    undefined;
  const publishedTime = row.publishedAt
    ? new Date(row.publishedAt * 1000).toISOString()
    : undefined;
  const modifiedTime = new Date(row.updatedAt * 1000).toISOString();
  const ogImageUrl =
    row.ogImage ??
    row.coverImageUrl ??
    profileData?.defaultOgImage ??
    profileData?.avatarUrl;
  const ogImage = ogImageUrl ? [{ url: ogImageUrl }] : undefined;

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: `/blog/${row.slug}`,
    },
    openGraph: {
      title: metaTitle,
      description,
      type: "article",
      publishedTime,
      modifiedTime,
      authors: row.authorName ? [row.authorName] : undefined,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
      images: ogImage,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const row = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      content: articles.content,
      excerpt: articles.excerpt,
      tags: articles.tags,
      status: articles.status,
      publishedAt: articles.publishedAt,
      authorId: articles.authorId,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      coverImageUrl: articles.coverImageUrl,
      difficulty: articles.difficulty,
      viewCount: articles.viewCount,
      authorIsBlocked: users.isBlocked,
      authorName: users.name,
      authorDisplayName: users.displayName,
      authorSlug: users.slug,
      ogTitle: articles.ogTitle,
      ogDescription: articles.ogDescription,
      ogImage: articles.ogImage,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.slug, slug),
        eq(articles.status, "published"),
        or(isNull(articles.authorId), eq(users.isBlocked, 0)),
      ),
    )
    .get();

  if (!row) {
    notFound();
  }

  const article = row;
  const session = await getSession();

  const [
    currentVersion,
    ratingRow,
    bookmarkCountRow,
    bookmarkExisting,
    subExisting,
    profileData,
  ] = await Promise.all([
    db
      .select({ id: articleVersions.id })
      .from(articleVersions)
      .where(eq(articleVersions.articleId, article.id))
      .orderBy(desc(articleVersions.createdAt))
      .limit(1)
      .get(),
    db
      .select({ rating: sum(articleVotes.value) })
      .from(articleVotes)
      .where(eq(articleVotes.articleId, article.id))
      .get(),
    db
      .select({ total: count() })
      .from(bookmarks)
      .where(eq(bookmarks.articleId, article.id))
      .get(),
    session.userId
      ? db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, session.userId),
              eq(bookmarks.articleId, article.id),
            ),
          )
          .get()
      : Promise.resolve(null),
    session.userId && article.authorId
      ? db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, session.userId),
              eq(subscriptions.authorId, article.authorId),
            ),
          )
          .get()
      : Promise.resolve(null),
    db
      .select({ name: profileTable.name })
      .from(profileTable)
      .where(eq(profileTable.id, "main"))
      .get(),
  ]);

  const currentVersionId = currentVersion?.id ?? null;
  const initialRating = Number(ratingRow?.rating ?? 0);
  const bookmarkCount = bookmarkCountRow?.total ?? 0;
  const initialBookmarked = !!bookmarkExisting;
  const initialSubscribed = !!subExisting;

  const mdxContent = await compileMDX(article.content);
  const tags = parseTags(article.tags);
  const readingTime = estimateReadingTime(article.content);
  const date = article.publishedAt
    ? new Date(article.publishedAt * 1000).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const authorName = article.authorDisplayName ?? article.authorName;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.excerpt?.trim() ? { description: article.excerpt.trim() } : {}),
    ...(article.coverImageUrl ? { image: article.coverImageUrl } : {}),
    ...(article.publishedAt
      ? { datePublished: new Date(article.publishedAt * 1000).toISOString() }
      : {}),
    dateModified: new Date(article.updatedAt * 1000).toISOString(),
    ...(article.authorName
      ? { author: { "@type": "Person", name: article.authorName } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: profileData?.name || "devblog",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${article.slug}`,
    },
  };

  return (
    <>
      <ScrollProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <ViewTracker articleId={article.id} />

        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block"
        >
          &larr; Назад к статьям
        </Link>

        {/* Mobile TOC */}
        <div className="lg:hidden mb-6">
          <TableOfContents content={article.content} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
          <article>
            {/* Cover image — wide, soft radius */}
            {article.coverImageUrl && (
              <div className="relative aspect-[2/1] w-full rounded-lg overflow-hidden mb-8">
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 740px"
                />
              </div>
            )}

            {/* Title */}
            <header className="mb-8">
              <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
                {article.title}
              </h1>

              {/* Meta line: date · author · reading time · difficulty */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-3">
                {date && <span>{date}</span>}
                {article.authorId && authorName && (
                  <>
                    <span aria-hidden="true">·</span>
                    {article.authorSlug ? (
                      <Link
                        href={`/authors/${article.authorSlug}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <span>{authorName}</span>
                    )}
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{readingTime} мин чтения</span>
                {article.viewCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{article.viewCount} просм.</span>
                  </>
                )}
                {article.difficulty && (
                  <>
                    <span aria-hidden="true">·</span>
                    <DifficultyBadge difficulty={article.difficulty} />
                  </>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Prose content */}
            <div className="prose max-w-none">
              {mdxContent}
              <CodeCopyButtons />
            </div>

            {/* Engagement row */}
            <div className="flex flex-wrap items-center gap-4 mt-10 pt-8 border-t border-border">
              <ArticleVoting
                articleId={article.id}
                initialRating={initialRating}
              />
              <BookmarkButton
                articleId={article.id}
                initialBookmarked={initialBookmarked}
                initialCount={bookmarkCount}
              />
              <div className="ml-auto">
                <ShareButton title={article.title} slug={article.slug} />
              </div>
            </div>

            {/* Subscribe to author */}
            {article.authorId && authorName && (
              <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                <span>
                  Автор:{" "}
                  <span className="text-foreground font-medium">
                    {authorName}
                  </span>
                </span>
                <SubscribeButton
                  authorId={article.authorId}
                  authorName={authorName}
                  initialSubscribed={initialSubscribed}
                />
              </div>
            )}
          </article>

          {/* Desktop TOC sidebar */}
          <aside className="hidden lg:block" data-toc>
            <TableOfContents content={article.content} />
          </aside>
        </div>

        <ArticleChangelog articleId={article.id} />

        <section className="mt-16 border-t border-border pt-12">
          <CommentSection
            articleId={article.id}
            currentVersionId={currentVersionId}
          />
        </section>
      </div>
    </>
  );
}
