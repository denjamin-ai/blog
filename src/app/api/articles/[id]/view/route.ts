import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: articleId } = await params;

  const cookieStore = await cookies();
  const cookieKey = `viewed_${articleId}`;

  // Дедупликация: уже просматривали в течение часа
  if (cookieStore.get(cookieKey)) {
    return NextResponse.json({ ok: true });
  }

  // Инкремент viewCount
  await db
    .update(articles)
    .set({ viewCount: sql`${articles.viewCount} + 1` })
    .where(eq(articles.id, articleId));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieKey, "1", {
    maxAge: 3600,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
