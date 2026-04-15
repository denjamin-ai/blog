import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = checkRateLimit(request, "user-login");
  if (rl.blocked) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут." },
      { status: 429 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { username, password } = body;

  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0 ||
    username.length > 50
  ) {
    return NextResponse.json({ error: "Неверный никнейм" }, { status: 400 });
  }
  if (
    !password ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 1000
  ) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 400 });
  }

  // Не позволять пользователю войти, если уже установлена admin-сессия
  const session = await getSession();
  if (session.isAdmin) {
    return NextResponse.json(
      { error: "Уже выполнен вход как admin" },
      { status: 409 },
    );
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase().trim()))
    .get();

  if (!user) {
    return NextResponse.json(
      { error: "Неверный никнейм или пароль" },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Неверный никнейм или пароль" },
      { status: 401 },
    );
  }

  session.userId = user.id;
  session.userRole = user.role;
  await session.save();

  return NextResponse.json({ ok: true, role: user.role });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    userId: session.userId ?? null,
    userRole: session.userRole ?? null,
  });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
