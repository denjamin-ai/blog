import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const { password } = body;
  if (!password || typeof password !== "string" || password.length > 1000) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
if (!hash) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD_HASH not configured" },
      { status: 500 }
    );
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

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
