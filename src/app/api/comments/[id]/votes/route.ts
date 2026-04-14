import { db } from "@/lib/db";
import { commentVotes, publicComments, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { checkUserRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: commentId } = await params;

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

  // Проверить комментарий
  const comment = await db
    .select({ id: publicComments.id, authorId: publicComments.authorId })
    .from(publicComments)
    .where(eq(publicComments.id, commentId))
    .get();

  if (!comment) {
    return NextResponse.json(
      { error: "Комментарий не найден" },
      { status: 404 },
    );
  }

  // Нельзя голосовать за свой комментарий
  if (comment.authorId === session.userId) {
    return NextResponse.json(
      { error: "Нельзя голосовать за свой комментарий" },
      { status: 403 },
    );
  }

  const { rating, userVote } = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: commentVotes.id, value: commentVotes.value })
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.userId, session.userId!),
          eq(commentVotes.commentId, commentId),
        ),
      )
      .get();

    if (existing) {
      if (existing.value === value) {
        // Отмена голоса
        await tx.delete(commentVotes).where(eq(commentVotes.id, existing.id));
      } else {
        // Смена голоса
        await tx
          .update(commentVotes)
          .set({ value })
          .where(eq(commentVotes.id, existing.id));
      }
    } else {
      await tx.insert(commentVotes).values({
        id: ulid(),
        userId: session.userId!,
        commentId,
        value,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    const ratingRow = await tx
      .select({ rating: sum(commentVotes.value) })
      .from(commentVotes)
      .where(eq(commentVotes.commentId, commentId))
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
