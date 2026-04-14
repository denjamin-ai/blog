import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewChecklists } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;

  const assignment = await db
    .select({
      reviewerId: reviewAssignments.reviewerId,
      status: reviewAssignments.status,
    })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.id, id))
    .get();

  if (!assignment) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (assignment.reviewerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (assignment.status !== "pending" && assignment.status !== "accepted") {
    return NextResponse.json(
      { error: "Нельзя редактировать чеклист завершённого назначения" },
      { status: 400 },
    );
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "items должен быть массивом" },
      { status: 400 },
    );
  }

  const items = body.items as { text: string; checked: boolean }[];

  await db
    .update(reviewChecklists)
    .set({ items: JSON.stringify(items) })
    .where(eq(reviewChecklists.assignmentId, id));

  return NextResponse.json({ ok: true });
}
