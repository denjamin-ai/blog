import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

export async function GET() {
  let session;
  try {
    session = await requireUser("reader");
  } catch (res) {
    return res as Response;
  }

  const rows = await db
    .select({
      id: subscriptions.id,
      authorId: subscriptions.authorId,
      authorName: users.name,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.authorId, users.id))
    .where(eq(subscriptions.userId, session.userId!));

  return NextResponse.json({ subscriptions: rows });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireUser("reader");
  } catch (res) {
    return res as Response;
  }

  let body: { authorId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный JSON" }, { status: 400 });
  }

  const { authorId } = body;
  if (!authorId || typeof authorId !== "string") {
    return NextResponse.json({ error: "authorId обязателен" }, { status: 400 });
  }

  // Проверить, что автор существует
  const author = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, authorId))
    .get();

  if (!author || author.role !== "author") {
    return NextResponse.json({ error: "Автор не найден" }, { status: 404 });
  }

  const { subscribed } = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.userId!),
          eq(subscriptions.authorId, authorId),
        ),
      )
      .get();

    if (existing) {
      // Отписаться
      await tx.delete(subscriptions).where(eq(subscriptions.id, existing.id));
      return { subscribed: false };
    } else {
      // Подписаться
      await tx.insert(subscriptions).values({
        id: ulid(),
        userId: session.userId!,
        authorId,
        createdAt: Math.floor(Date.now() / 1000),
      });
      return { subscribed: true };
    }
  });

  return NextResponse.json({ subscribed });
}
