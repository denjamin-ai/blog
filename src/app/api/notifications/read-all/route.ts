import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(_request: Request) {
  const session = await getSession();

  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.isAdmin) {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(
        and(eq(notifications.isAdminRecipient, 1), eq(notifications.isRead, 0)),
      );
  } else {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(
        and(
          eq(notifications.recipientId, session.userId!),
          eq(notifications.isRead, 0),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}
