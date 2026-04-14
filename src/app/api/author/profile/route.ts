import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuthor } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAuthor();

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      links: users.links,
      slug: users.slug,
    })
    .from(users)
    .where(eq(users.id, session.userId!))
    .get();

  if (!user) {
    return NextResponse.json(
      { error: "Пользователь не найден" },
      { status: 404 },
    );
  }

  let links: Record<string, string> = {};
  try {
    if (user.links) links = JSON.parse(user.links);
  } catch {
    links = {};
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    links,
    slug: user.slug,
  });
}

export async function PUT(request: Request) {
  const session = await requireAuthor();

  let body: {
    displayName?: unknown;
    bio?: unknown;
    avatarUrl?: unknown;
    links?: unknown;
    slug?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { displayName, bio, avatarUrl, links, slug } = body;

  // Валидация
  if (displayName !== undefined) {
    if (typeof displayName !== "string" || !displayName.trim()) {
      return NextResponse.json(
        { error: "Отображаемое имя не может быть пустым" },
        { status: 400 },
      );
    }
    if (displayName.length > 100) {
      return NextResponse.json(
        { error: "Имя слишком длинное (макс. 100 символов)" },
        { status: 400 },
      );
    }
  }

  if (bio !== undefined && typeof bio === "string" && bio.length > 500) {
    return NextResponse.json(
      { error: "Bio слишком длинное (макс. 500 символов)" },
      { status: 400 },
    );
  }

  if (
    avatarUrl !== undefined &&
    avatarUrl !== null &&
    typeof avatarUrl === "string" &&
    avatarUrl &&
    !avatarUrl.startsWith("/uploads/") &&
    !avatarUrl.startsWith("https://")
  ) {
    return NextResponse.json(
      { error: "Недопустимый URL аватара" },
      { status: 400 },
    );
  }

  if (slug !== undefined && slug !== null && slug !== "") {
    if (typeof slug !== "string") {
      return NextResponse.json({ error: "Недопустимый slug" }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug может содержать только строчные буквы, цифры и дефисы" },
        { status: 400 },
      );
    }
    if (slug.length > 100) {
      return NextResponse.json(
        { error: "Slug слишком длинный (макс. 100 символов)" },
        { status: 400 },
      );
    }
    // Проверка уникальности
    const conflict = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.slug, slug), ne(users.id, session.userId!)))
      .get();
    if (conflict) {
      return NextResponse.json(
        { error: "Этот slug уже занят" },
        { status: 409 },
      );
    }
  }

  // Валидация links
  if (links !== undefined && links !== null) {
    if (typeof links !== "object" || Array.isArray(links)) {
      return NextResponse.json(
        { error: "links должен быть объектом" },
        { status: 400 },
      );
    }
  }

  const now = Math.floor(Date.now() / 1000);

  await db
    .update(users)
    .set({
      ...(displayName !== undefined
        ? { displayName: (displayName as string).trim() }
        : {}),
      ...(bio !== undefined
        ? { bio: bio === null ? null : (bio as string) }
        : {}),
      ...(avatarUrl !== undefined
        ? { avatarUrl: avatarUrl === null ? null : (avatarUrl as string) }
        : {}),
      ...(links !== undefined
        ? {
            links:
              links === null
                ? null
                : JSON.stringify(links as Record<string, string>),
          }
        : {}),
      ...(slug !== undefined
        ? {
            slug: slug === null || slug === "" ? null : (slug as string),
          }
        : {}),
      updatedAt: now,
    })
    .where(eq(users.id, session.userId!));

  return NextResponse.json({ ok: true });
}
