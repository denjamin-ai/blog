import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profile } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const data = await db
    .select({
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      links: profile.links,
      defaultOgImage: profile.defaultOgImage,
    })
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();

  if (!data) {
    return NextResponse.json({
      name: "",
      bio: "",
      avatarUrl: null,
      links: {},
      defaultOgImage: null,
    });
  }

  let links: Record<string, string> = {};
  try {
    links = JSON.parse(data.links || "{}");
  } catch {
    links = {};
  }

  return NextResponse.json({ ...data, links });
}

export async function PUT(request: Request) {
  await requireAdmin();

  let body: {
    name?: unknown;
    bio?: unknown;
    avatarUrl?: unknown;
    links?: unknown;
    defaultOgImage?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { name, bio, avatarUrl, links, defaultOgImage } = body;

  const now = Math.floor(Date.now() / 1000);

  // Upsert profile record
  const existing = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();

  if (existing) {
    await db
      .update(profile)
      .set({
        ...(typeof name === "string" ? { name } : {}),
        ...(typeof bio === "string" ? { bio } : {}),
        ...(avatarUrl === null || typeof avatarUrl === "string"
          ? { avatarUrl: avatarUrl as string | null }
          : {}),
        ...(links !== undefined
          ? {
              links:
                typeof links === "object" && links !== null
                  ? JSON.stringify(links)
                  : "{}",
            }
          : {}),
        ...(defaultOgImage === null || typeof defaultOgImage === "string"
          ? { defaultOgImage: defaultOgImage as string | null }
          : {}),
        updatedAt: now,
      })
      .where(eq(profile.id, "main"));
  } else {
    await db.insert(profile).values({
      id: "main",
      name: typeof name === "string" ? name : "",
      bio: typeof bio === "string" ? bio : "",
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null,
      links:
        typeof links === "object" && links !== null
          ? JSON.stringify(links)
          : "{}",
      defaultOgImage:
        typeof defaultOgImage === "string" ? defaultOgImage : null,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}
