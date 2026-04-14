import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, lt, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "30", 10);
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 30 : rawLimit));
  const offset = (page - 1) * limit;

  // Prune read notifications older than 30 days (only for the current recipient)
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const pruneConditions = session.isAdmin
    ? and(
        eq(notifications.isRead, 1),
        lt(notifications.createdAt, thirtyDaysAgo),
        eq(notifications.isAdminRecipient, 1),
      )
    : and(
        eq(notifications.isRead, 1),
        lt(notifications.createdAt, thirtyDaysAgo),
        eq(notifications.recipientId, session.userId!),
      );
  await db.delete(notifications).where(pruneConditions);

  const baseConditions = session.isAdmin
    ? [eq(notifications.isAdminRecipient, 1)]
    : [eq(notifications.recipientId, session.userId!)];

  if (unreadOnly) baseConditions.push(eq(notifications.isRead, 0));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(notifications)
    .where(and(...baseConditions));

  const totalPages = Math.ceil(total / limit);

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...baseConditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  // Parse payload with try-catch as per conventions
  const result = rows.map((n) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(n.payload);
    } catch {
      // keep empty object
    }
    return { ...n, payload };
  });

  return NextResponse.json({ notifications: result, total, page, totalPages });
}
