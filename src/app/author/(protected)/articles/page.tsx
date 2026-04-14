import { requireAuthor } from "@/lib/auth";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuthorArticlesPage() {
  const session = await requireAuthor();

  const myArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.authorId, session.userId!))
    .orderBy(desc(articles.updatedAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Мои статьи</h1>
        <Link
          href="/author/articles/new"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Новая статья
        </Link>
      </div>

      {myArticles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">У вас пока нет статей.</p>
          <Link
            href="/author/articles/new"
            className="text-accent hover:underline"
          >
            Написать первую статью
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Обновлено</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {myArticles.map((article) => (
                <tr
                  key={article.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/author/articles/${article.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        article.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {article.status === "published"
                        ? "Опубликовано"
                        : "Черновик"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(article.updatedAt * 1000).toLocaleDateString(
                      "ru-RU",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/author/articles/${article.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Редактировать
                      </Link>
                      <Link
                        href={`/author/articles/${article.id}/history`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        История
                      </Link>
                      <Link
                        href={`/author/articles/${article.id}/review`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Ревью
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
