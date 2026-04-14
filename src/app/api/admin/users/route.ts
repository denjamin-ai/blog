import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, eq, or, like } from "drizzle-orm";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") ?? searchParams.get("q"))?.trim();
  const roleFilter = searchParams.get("role") as "reviewer" | "reader" | null;

  const conditions = [];
  if (search) {
    conditions.push(
      or(like(users.username, `%${search}%`), like(users.name, `%${search}%`)),
    );
  }
  if (
    roleFilter === "reviewer" ||
    roleFilter === "reader" ||
    roleFilter === "author"
  ) {
    conditions.push(eq(users.role, roleFilter));
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(...conditions));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await requireAdmin();

  let body: {
    username?: unknown;
    name?: unknown;
    role?: unknown;
    password?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { username, name, role, password } = body;

  const usernameRe = /^[a-z0-9]{4,50}$/;
  if (
    !username ||
    typeof username !== "string" ||
    !usernameRe.test(username.trim().toLowerCase())
  ) {
    return NextResponse.json(
      { error: "Никнейм: от 4 до 50 символов, только латинские буквы и цифры" },
      { status: 400 },
    );
  }
  if (!name || typeof name !== "string" || name.length > 255) {
    return NextResponse.json({ error: "name обязателен" }, { status: 400 });
  }
  if (role !== "reviewer" && role !== "reader" && role !== "author") {
    return NextResponse.json(
      { error: "role должен быть reviewer, reader или author" },
      { status: 400 },
    );
  }
  if (
    !password ||
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 1000
  ) {
    return NextResponse.json(
      { error: "Пароль: минимум 6 символов" },
      { status: 400 },
    );
  }

  const normalizedUsername = username.toLowerCase().trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, normalizedUsername))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким никнеймом уже существует" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = Math.floor(Date.now() / 1000);
  const id = ulid();

  try {
    await db.insert(users).values({
      id,
      username: normalizedUsername,
      name,
      role,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Пользователь с таким никнеймом уже существует" },
        { status: 409 },
      );
    }
    console.error("POST /api/admin/users db.insert failed:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
