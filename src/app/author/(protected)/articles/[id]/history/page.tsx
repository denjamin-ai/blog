import { db } from "@/lib/db";
import { articles, articleVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuthor } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthorHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuthor();
  const { id } = await params;

  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article || article.authorId !== session.userId) {
    notFound();
  }

  const versions = await db
    .select()
    .from(articleVersions)
    .where(eq(articleVersions.articleId, id))
    .orderBy(desc(articleVersions.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">История изменений</h1>
          <p className="text-muted-foreground text-sm mt-1">{article.title}</p>
        </div>
        <Link
          href={`/author/articles/${id}`}
          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          &larr; К редактированию
        </Link>
      </div>

      {versions.length === 0 ? (
        <p className="text-muted-foreground">
          История пуста. Версии создаются при каждом сохранении.
        </p>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <details
              key={version.id}
              className="border border-border rounded-lg"
            >
              <summary className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="inline-flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {new Date(version.createdAt * 1000).toLocaleString("ru-RU")}
                  </span>
                  {version.changeNote && (
                    <span className="text-sm text-muted-foreground">
                      — {version.changeNote}
                    </span>
                  )}
                </div>
              </summary>
              <div className="px-4 py-3 border-t border-border">
                <h3 className="font-medium mb-2">{version.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  Исходный код MDX
                </p>
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                  {version.content}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
