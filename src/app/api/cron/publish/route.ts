import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, users, subscriptions, notifications } from "@/lib/db/schema";
import { eq, lte, and, isNotNull, inArray } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Проверяем секрет cron-задачи
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);

  // Найти все запланированные статьи с данными автора одним запросом
  const due = await db
    .select({
      id: articles.id,
      title: articles.title,
      authorId: articles.authorId,
      publishedAt: articles.publishedAt,
      authorName: users.name,
      authorIsBlocked: users.isBlocked,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, "scheduled"),
        isNotNull(articles.scheduledAt),
        lte(articles.scheduledAt, now),
      ),
    );

  const toPublish = due.filter((a) => !a.authorIsBlocked);
  const skipped = due.length - toPublish.length;

  if (toPublish.length === 0) {
    return NextResponse.json({ published: 0, skipped });
  }

  // Публикуем одним batch-запросом
  await db
    .update(articles)
    .set({ status: "published", scheduledAt: null, updatedAt: now })
    .where(
      inArray(
        articles.id,
        toPublish.map((a) => a.id),
      ),
    );

  // Для первой публикации — проставляем publishedAt и уведомляем подписчиков
  const firstPublish = toPublish.filter((a) => !a.publishedAt && a.authorId);
  for (const article of firstPublish) {
    await db
      .update(articles)
      .set({ publishedAt: now })
      .where(eq(articles.id, article.id));

    const subs = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.authorId, article.authorId!));

    if (subs.length > 0) {
      await db.insert(notifications).values(
        subs.map((sub) => ({
          id: ulid(),
          recipientId: sub.userId,
          isAdminRecipient: 0,
          type: "new_article_by_subscribed_author" as const,
          payload: JSON.stringify({
            articleId: article.id,
            articleTitle: article.title,
            authorName: article.authorName ?? "",
          }),
          isRead: 0,
          createdAt: now,
        })),
      );
    }
  }

  return NextResponse.json({ published: toPublish.length, skipped });
}
