import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  articles,
  notifications,
  reviewComments,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      isBlocked: users.isBlocked,
      commentingBlocked: users.commentingBlocked,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let body: {
    name?: unknown;
    username?: unknown;
    password?: unknown;
    isBlocked?: unknown;
    commentingBlocked?: unknown;
    role?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { name, username, password, isBlocked, commentingBlocked, role } = body;

  if (name !== undefined && (typeof name !== "string" || name.length > 255)) {
    return NextResponse.json({ error: "Недопустимое имя" }, { status: 400 });
  }
  const usernameRe = /^[a-z0-9]{4,50}$/;
  if (
    username !== undefined &&
    (typeof username !== "string" ||
      !usernameRe.test(username.trim().toLowerCase()))
  ) {
    return NextResponse.json(
      { error: "Никнейм: от 4 до 50 символов, только латинские буквы и цифры" },
      { status: 400 },
    );
  }
  if (
    password !== undefined &&
    (typeof password !== "string" ||
      password.length < 6 ||
      password.length > 1000)
  ) {
    return NextResponse.json(
      { error: "Пароль: минимум 6 символов" },
      { status: 400 },
    );
  }
  if (isBlocked !== undefined && isBlocked !== 0 && isBlocked !== 1) {
    return NextResponse.json(
      { error: "isBlocked должен быть 0 или 1" },
      { status: 400 },
    );
  }
  if (
    commentingBlocked !== undefined &&
    commentingBlocked !== 0 &&
    commentingBlocked !== 1
  ) {
    return NextResponse.json(
      { error: "commentingBlocked должен быть 0 или 1" },
      { status: 400 },
    );
  }
  if (
    role !== undefined &&
    role !== "reviewer" &&
    role !== "reader" &&
    role !== "author"
  ) {
    return NextResponse.json(
      { error: "Роль должна быть reviewer, reader или author" },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: users.id, role: users.role, isBlocked: users.isBlocked })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Check username uniqueness if changed
  if (username !== undefined) {
    const normalizedUsername = (username as string).toLowerCase().trim();
    const conflict = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, normalizedUsername), ne(users.id, id)))
      .get();
    if (conflict) {
      return NextResponse.json(
        { error: "Пользователь с таким никнеймом уже существует" },
        { status: 409 },
      );
    }
  }

  const now = Math.floor(Date.now() / 1000);

  const updateValues: Record<string, unknown> = { updatedAt: now };
  if (name !== undefined) updateValues.name = name;
  if (username !== undefined)
    updateValues.username = (username as string).toLowerCase().trim();
  if (password !== undefined)
    updateValues.passwordHash = await bcrypt.hash(password as string, 10);
  if (isBlocked !== undefined) updateValues.isBlocked = isBlocked;
  if (commentingBlocked !== undefined)
    updateValues.commentingBlocked = commentingBlocked;
  if (role !== undefined) updateValues.role = role;

  try {
    await db.update(users).set(updateValues).where(eq(users.id, id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Пользователь с таким никнеймом уже существует" },
        { status: 409 },
      );
    }
    console.error("PUT /api/admin/users/[id] db.update failed:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  // Если admin блокирует автора — снимаем его статьи с публикации и уведомляем
  if (
    isBlocked === 1 &&
    existing.isBlocked === 0 &&
    existing.role === "author"
  ) {
    await db
      .update(articles)
      .set({ status: "draft", updatedAt: now })
      .where(and(eq(articles.authorId, id), eq(articles.status, "published")));

    await db.insert(notifications).values({
      id: ulid(),
      recipientId: id,
      isAdminRecipient: 0,
      type: "article_hidden",
      payload: JSON.stringify({}),
      isRead: 0,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // SQLite не гарантирует FK-каскады без PRAGMA foreign_keys=ON
  // обнуляем FK-ссылки на пользователя вручную перед удалением
  await db
    .update(articles)
    .set({ authorId: null })
    .where(eq(articles.authorId, id));

  await db
    .update(reviewComments)
    .set({ authorId: null })
    .where(eq(reviewComments.authorId, id));

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}
