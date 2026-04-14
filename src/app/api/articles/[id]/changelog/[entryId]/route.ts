import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articleChangelog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  await requireAdmin();
  const { id, entryId } = await params;

  const entry = await db
    .select({ id: articleChangelog.id, articleId: articleChangelog.articleId })
    .from(articleChangelog)
    .where(eq(articleChangelog.id, entryId))
    .get();

  if (!entry || entry.articleId !== id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await db.delete(articleChangelog).where(eq(articleChangelog.id, entryId));

  return NextResponse.json({ ok: true });
}
