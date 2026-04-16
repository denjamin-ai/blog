import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, or, like, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isAdmin && session.userRole !== "author") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  if (!search || search.length < 2) {
    return NextResponse.json([]);
  }

  // Escape LIKE special characters to prevent filter bypass (e.g. search="%%")
  const safeTerm = search.replace(/%/g, "\\%").replace(/_/g, "\\_");

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "reviewer"),
        ne(users.isBlocked, 1),
        or(
          like(users.username, `%${safeTerm}%`),
          like(users.name, `%${safeTerm}%`),
        ),
      ),
    );

  return NextResponse.json(rows);
}
