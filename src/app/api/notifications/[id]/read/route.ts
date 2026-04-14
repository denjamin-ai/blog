import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session.isAdmin && !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const notif = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id))
    .get();

  if (!notif) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Ownership check
  if (session.isAdmin && !notif.isAdminRecipient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.isAdmin && notif.recipientId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.id, id));

  return NextResponse.json({ ok: true });
}
