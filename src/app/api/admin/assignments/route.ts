import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  articleVersions,
  reviewAssignments,
  reviewChecklists,
  users,
  notifications,
  profile,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, or, desc } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  const rows = await db
    .select({
      id: reviewAssignments.id,
      articleId: reviewAssignments.articleId,
      articleVersionId: reviewAssignments.articleVersionId,
      reviewerId: reviewAssignments.reviewerId,
      status: reviewAssignments.status,
      reviewerNote: reviewAssignments.reviewerNote,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
      reviewerName: users.name,
      reviewerUsername: users.username,
    })
    .from(reviewAssignments)
    .leftJoin(users, eq(reviewAssignments.reviewerId, users.id))
    .where(articleId ? eq(reviewAssignments.articleId, articleId) : undefined)
    .orderBy(desc(reviewAssignments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await requireAdmin();

  let body: { articleId?: unknown; reviewerId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { articleId, reviewerId } = body;

  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json(
      { error: "articleId обязателен" },
      { status: 400 },
    );
  }
  if (!reviewerId || typeof reviewerId !== "string") {
    return NextResponse.json(
      { error: "reviewerId обязателен" },
      { status: 400 },
    );
  }

  // Verify article exists
  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
    })
    .from(articles)
    .where(eq(articles.id, articleId))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  // Verify reviewer exists and has correct role
  const reviewer = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, reviewerId))
    .get();

  if (!reviewer || reviewer.role !== "reviewer") {
    return NextResponse.json({ error: "Ревьер не найден" }, { status: 404 });
  }

  // Guard: no existing pending/accepted assignment for same (articleId, reviewerId)
  const existing = await db
    .select({ id: reviewAssignments.id })
    .from(reviewAssignments)
    .where(
      and(
        eq(reviewAssignments.articleId, articleId),
        eq(reviewAssignments.reviewerId, reviewerId),
        or(
          eq(reviewAssignments.status, "pending"),
          eq(reviewAssignments.status, "accepted"),
        ),
      ),
    )
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Уже есть активное назначение для этой пары статья/ревьер" },
      { status: 409 },
    );
  }

  const now = Math.floor(Date.now() / 1000);

  // Get or create version snapshot
  let versionId: string;
  const latestVersion = await db
    .select({ id: articleVersions.id })
    .from(articleVersions)
    .where(eq(articleVersions.articleId, articleId))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1)
    .get();

  if (latestVersion) {
    versionId = latestVersion.id;
  } else {
    // No versions yet — create a snapshot now
    versionId = ulid();
    await db.insert(articleVersions).values({
      id: versionId,
      articleId,
      title: article.title,
      content: article.content,
      createdAt: now,
      changeNote: "Снимок для ревью",
    });
  }

  const assignmentId = ulid();
  await db.insert(reviewAssignments).values({
    id: assignmentId,
    articleId,
    articleVersionId: versionId,
    reviewerId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  // Notify reviewer
  await db.insert(notifications).values({
    id: ulid(),
    recipientId: reviewerId,
    isAdminRecipient: 0,
    type: "assignment_created",
    payload: JSON.stringify({ articleId, assignmentId }),
    isRead: 0,
    createdAt: now,
  });

  // Копируем шаблон чеклиста, если он настроен
  const prof = await db
    .select({ checklistTemplate: profile.checklistTemplate })
    .from(profile)
    .where(eq(profile.id, "main"))
    .get();
  if (prof?.checklistTemplate) {
    let tmpl: { text: string }[] = [];
    try {
      tmpl = JSON.parse(prof.checklistTemplate);
    } catch {
      tmpl = [];
    }
    if (tmpl.length > 0) {
      const items = tmpl.map((i) => ({ text: i.text, checked: false }));
      await db.insert(reviewChecklists).values({
        id: ulid(),
        assignmentId,
        items: JSON.stringify(items),
        createdAt: now,
      });
    }
  }

  return NextResponse.json({ id: assignmentId }, { status: 201 });
}
