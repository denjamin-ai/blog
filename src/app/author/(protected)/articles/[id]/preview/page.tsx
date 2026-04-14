import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuthor } from "@/lib/auth";
import { compileMDX } from "@/lib/mdx";
import { estimateReadingTime } from "@/lib/reading-time";
import { parseTags } from "@/lib/utils";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TableOfContents } from "@/components/toc";
import { CodeCopyButtons } from "@/components/mdx/copy-button";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthorArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuthor();
  const { id } = await params;

  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
      excerpt: articles.excerpt,
      tags: articles.tags,
      coverImageUrl: articles.coverImageUrl,
      difficulty: articles.difficulty,
      publishedAt: articles.publishedAt,
      authorId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article || article.authorId !== session.userId) notFound();

  let compiledContent: React.ReactNode = null;
  let mdxError: string | null = null;
  try {
    compiledContent = await compileMDX(article.content);
  } catch (err) {
    mdxError = err instanceof Error ? err.message : "Ошибка компиляции MDX";
  }

  const tags = parseTags(article.tags);
  const readingTime = estimateReadingTime(article.content);
  const date = article.publishedAt
    ? new Date(article.publishedAt * 1000).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-xs text-muted-foreground mb-6 border border-border rounded-lg px-3 py-2 inline-block">
        Предпросмотр — статья не опубликована
      </p>

      {/* Mobile TOC */}
      <div className="xl:hidden mb-6">
        <TableOfContents content={article.content} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-8">
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {date && <span>{date}</span>}
              <span>{readingTime} мин чтения</span>
              {article.difficulty && (
                <DifficultyBadge difficulty={article.difficulty} />
              )}
              {tags.length > 0 && (
                <div className="flex gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-muted text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {article.coverImageUrl && (
            <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-8">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 800px"
              />
            </div>
          )}

          {mdxError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                Ошибка компиляции MDX:
              </p>
              <pre className="text-xs text-red-500 whitespace-pre-wrap">
                {mdxError}
              </pre>
            </div>
          ) : (
            <div className="prose">
              {compiledContent}
              <CodeCopyButtons />
            </div>
          )}
        </article>

        <aside className="hidden xl:block" data-toc>
          <TableOfContents content={article.content} />
        </aside>
      </div>
    </div>
  );
}
