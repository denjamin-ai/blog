import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profile } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const row = await db
    .select({ checklistTemplate: profile.checklistTemplate })
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();

  let items: { text: string }[] = [];
  if (row?.checklistTemplate) {
    try {
      items = JSON.parse(row.checklistTemplate);
    } catch {
      items = [];
    }
  }

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  await requireAdmin();

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

  const items = body.items as string[];
  if (!items.every((i) => typeof i === "string")) {
    return NextResponse.json(
      { error: "Каждый пункт должен быть строкой" },
      { status: 400 },
    );
  }

  const template = items
    .map((text) => ({ text: text.trim() }))
    .filter((i) => i.text.length > 0);

  await db
    .update(profile)
    .set({ checklistTemplate: JSON.stringify(template) })
    .where(eq(profile.id, "main"));

  return NextResponse.json({ ok: true });
}
