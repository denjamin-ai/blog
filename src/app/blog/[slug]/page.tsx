import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { compileMDX } from "@/lib/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeCopyButtons } from "@/components/mdx/copy-button";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .get();

  if (!article) {
    notFound();
  }

  const content = await compileMDX(article.content);
  let tags: string[] = [];
  try {
    tags = article.tags ? JSON.parse(article.tags) : [];
  } catch { /* malformed tags */ }
  const date = article.publishedAt
    ? new Date(article.publishedAt * 1000).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link
        href="/blog"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block"
      >
        &larr; Назад к блогу
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {date && <span>{date}</span>}
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

        <div className="prose">
          {content}
          <CodeCopyButtons />
        </div>
      </article>
    </div>
  );
}
