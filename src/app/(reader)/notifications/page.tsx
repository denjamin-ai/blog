import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { MarkAllReadButton } from "./mark-all-read-button";

export const dynamic = "force-dynamic";

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReaderNotificationsPage() {
  const session = await requireUser("reader");

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, session.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const items = rows.map((n) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(n.payload);
    } catch {
      // ignore
    }
    return { ...n, payload };
  });

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Уведомления</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          Нет уведомлений. Подпишитесь на авторов, чтобы получать уведомления о
          новых статьях.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const isNew = !n.isRead;

            let label: React.ReactNode = null;
            if (n.type === "new_article_by_subscribed_author") {
              const { articleId, articleTitle, authorName } = n.payload as {
                articleId?: string;
                articleTitle?: string;
                authorName?: string;
              };
              label = (
                <span>
                  Новая статья от{" "}
                  <span className="font-medium">{authorName ?? "автора"}</span>:{" "}
                  {articleId ? (
                    <Link
                      href={`/blog/${articleId}`}
                      className="text-accent hover:underline"
                    >
                      {articleTitle ?? "Без названия"}
                    </Link>
                  ) : (
                    <span>{articleTitle ?? "Без названия"}</span>
                  )}
                </span>
              );
            } else if (n.type === "article_updated_for_subscribers") {
              const { articleId, articleTitle, authorName } = n.payload as {
                articleId?: string;
                articleTitle?: string;
                authorName?: string;
              };
              label = (
                <span>
                  Статья обновлена —{" "}
                  <span className="font-medium">{authorName ?? "автор"}</span>:{" "}
                  {articleId ? (
                    <Link
                      href={`/blog/${articleId}`}
                      className="text-accent hover:underline"
                    >
                      {articleTitle ?? "Без названия"}
                    </Link>
                  ) : (
                    <span>{articleTitle ?? "Без названия"}</span>
                  )}
                </span>
              );
            } else if (n.type === "public_comment_reply") {
              const { articleId, isAuthorReply } = n.payload as {
                articleId?: string;
                isAuthorReply?: boolean;
              };
              label = (
                <span>
                  {isAuthorReply
                    ? "Автор ответил на ваш комментарий"
                    : "На ваш комментарий ответили"}
                  {articleId && (
                    <>
                      {" — "}
                      <Link
                        href={`/blog/${articleId}`}
                        className="text-accent hover:underline"
                      >
                        перейти к статье
                      </Link>
                    </>
                  )}
                </span>
              );
            } else {
              label = <span className="capitalize">{n.type}</span>;
            }

            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  isNew
                    ? "border-accent/40 bg-accent/5"
                    : "border-border bg-transparent"
                }`}
              >
                {isNew && (
                  <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-accent" />
                )}
                <div className={`flex flex-col gap-1 ${isNew ? "" : "ml-5"}`}>
                  <p className="text-sm">{label}</p>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </time>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
