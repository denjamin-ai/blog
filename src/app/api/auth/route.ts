import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  // Only reject when origin is explicitly present AND mismatched.
  // Requests without an origin header (same-origin fetch, Safari, CLI) are allowed.
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

  const rl = checkRateLimit(request);
  if (rl.blocked) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут." },
      { status: 429 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { password } = body;
  if (
    !password ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 1000
  ) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    console.error("ADMIN_PASSWORD_HASH is not configured");
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
