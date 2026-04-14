import { db } from "@/lib/db";
import { bookmarks, articles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { parseTags } from "@/lib/utils";
import { RemoveBookmarkButton } from "./remove-bookmark-button";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const session = await requireUser("reader");

  const rows = await db
    .select({
      id: bookmarks.id,
      createdAt: bookmarks.createdAt,
      articleId: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      tags: articles.tags,
    })
    .from(bookmarks)
    .innerJoin(articles, eq(bookmarks.articleId, articles.id))
    .where(eq(bookmarks.userId, session.userId!))
    .orderBy(desc(bookmarks.createdAt));

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Закладки</h1>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          Вы ещё не добавили статьи в закладки.{" "}
          <Link href="/blog" className="text-accent hover:underline">
            Перейти в блог
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((row) => {
            const tags = parseTags(row.tags);
            const addedDate = new Date(row.createdAt * 1000).toLocaleDateString(
              "ru-RU",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );

            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 p-4 border border-border rounded-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/blog/${row.slug}`}
                    className="text-lg font-semibold hover:text-accent transition-colors"
                  >
                    {row.title}
                  </Link>
                  <RemoveBookmarkButton articleId={row.articleId} />
                </div>

                {row.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {row.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Добавлено {addedDate}</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
