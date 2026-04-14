import { db } from "@/lib/db";
import { articleVotes, articles, users } from "@/lib/db/schema";
import { getSession, requireUser } from "@/lib/auth";
import { eq, and, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { checkUserRateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: articleId } = await params;
  const session = await getSession();

  const ratingRow = await db
    .select({ rating: sum(articleVotes.value) })
    .from(articleVotes)
    .where(eq(articleVotes.articleId, articleId))
    .get();

  const rating = Number(ratingRow?.rating ?? 0);

  let userVote: 1 | -1 | null = null;
  if (session.userId) {
    const existing = await db
      .select({ value: articleVotes.value })
      .from(articleVotes)
      .where(
        and(
          eq(articleVotes.userId, session.userId),
          eq(articleVotes.articleId, articleId),
        ),
      )
      .get();
    if (existing) userVote = existing.value as 1 | -1;
  }

  return NextResponse.json({ userVote, rating });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: articleId } = await params;

  let session;
  try {
    session = await requireUser();
  } catch (res) {
    return res as Response;
  }

  let body: { value?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный JSON" }, { status: 400 });
  }

  const { value } = body;
  if (value !== 1 && value !== -1) {
    return NextResponse.json(
      { error: "value должен быть 1 или -1" },
      { status: 400 },
    );
  }

  // Проверить статью
  const article = await db
    .select({
      id: articles.id,
      authorId: articles.authorId,
      status: articles.status,
    })
    .from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.status, "published")))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Нельзя голосовать за свою статью
  if (article.authorId && article.authorId === session.userId) {
    return NextResponse.json(
      { error: "Нельзя голосовать за свою статью" },
      { status: 403 },
    );
  }

  // Rate limit: 1 запрос/секунду на пользователя
  const { blocked } = checkUserRateLimit(session.userId!, 1000, 1);
  if (blocked) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      { status: 429 },
    );
  }

  // Проверить блокировку
  const user = await db
    .select({ commentingBlocked: users.commentingBlocked })
    .from(users)
    .where(eq(users.id, session.userId!))
    .get();

  if (user?.commentingBlocked) {
    return NextResponse.json(
      { error: "Голосование заблокировано администратором" },
      { status: 403 },
    );
  }

  const { rating, userVote } = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: articleVotes.id, value: articleVotes.value })
      .from(articleVotes)
      .where(
        and(
          eq(articleVotes.userId, session.userId!),
          eq(articleVotes.articleId, articleId),
        ),
      )
      .get();

    if (existing) {
      if (existing.value === value) {
        // Повторный клик — отмена голоса
        await tx.delete(articleVotes).where(eq(articleVotes.id, existing.id));
      } else {
        // Смена голоса
        await tx
          .update(articleVotes)
          .set({ value })
          .where(eq(articleVotes.id, existing.id));
      }
    } else {
      await tx.insert(articleVotes).values({
        id: ulid(),
        userId: session.userId!,
        articleId,
        value,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    const ratingRow = await tx
      .select({ rating: sum(articleVotes.value) })
      .from(articleVotes)
      .where(eq(articleVotes.articleId, articleId))
      .get();

    const rating = Number(ratingRow?.rating ?? 0);

    let userVote: 1 | -1 | null = null;
    if (existing && existing.value !== value) {
      userVote = value as 1 | -1;
    } else if (!existing) {
      userVote = value as 1 | -1;
    }

    return { rating, userVote };
  });

  return NextResponse.json({ userVote, rating });
}
