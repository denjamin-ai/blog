import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  articleVersions,
  articleChangelog,
  reviewAssignments,
  reviewSessions,
  subscriptions,
  bookmarks,
  users,
  notifications,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, ne, or, desc } from "drizzle-orm";
import { ulid } from "ulid";
import {
  createSessionWithAssignments,
  validateReviewerCount,
} from "@/lib/session-helpers";

// Resolves access for admin or author. Returns null if unauthorized.
// For author, also returns their userId for ownership checks.
async function resolveAccess() {
  const session = await getSession();
  if (session.isAdmin) return { isAdmin: true, userId: null as string | null };
  if (session.userId && session.userRole === "author")
    return { isAdmin: false, userId: session.userId };
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await resolveAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Автор может видеть только свои статьи
  if (!access.isAdmin && article.authorId !== access.userId) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await resolveAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: {
    title?: unknown;
    slug?: unknown;
    content?: unknown;
    excerpt?: unknown;
    tags?: unknown;
    status?: unknown;
    changeNote?: unknown;
    saveMode?: unknown;
    reviewerId?: unknown;
    reviewerIds?: unknown;
    changelog?: unknown;
    coverImageUrl?: unknown;
    difficulty?: unknown;
    scheduledAt?: unknown;
    ogTitle?: unknown;
    ogDescription?: unknown;
    ogImage?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const {
    title,
    slug,
    content,
    excerpt,
    tags,
    status,
    changeNote,
    saveMode,
    reviewerId,
    reviewerIds: reviewerIdsRaw,
    changelog,
    coverImageUrl,
    difficulty,
    scheduledAt,
    ogTitle,
    ogDescription,
    ogImage,
  } = body;

  // Поддержка обоих форматов: reviewerIds (массив) и reviewerId (строка, legacy)
  const reviewerIds: string[] = Array.isArray(reviewerIdsRaw)
    ? (reviewerIdsRaw as string[])
    : typeof reviewerId === "string" && reviewerId
      ? [reviewerId]
      : [];

  if (
    title !== undefined &&
    (typeof title !== "string" || title.length > 500)
  ) {
    return NextResponse.json(
      { error: "Недопустимый заголовок (макс. 500 символов)" },
      { status: 400 },
    );
  }
  if (slug !== undefined && (typeof slug !== "string" || slug.length > 255)) {
    return NextResponse.json(
      { error: "Недопустимый slug (макс. 255 символов)" },
      { status: 400 },
    );
  }
  if (
    content !== undefined &&
    typeof content === "string" &&
    content.length > 500_000
  ) {
    return NextResponse.json(
      { error: "Контент слишком большой (макс. 500 000 символов)" },
      { status: 400 },
    );
  }
  if (
    excerpt !== undefined &&
    typeof excerpt === "string" &&
    excerpt.length > 1000
  ) {
    return NextResponse.json(
      { error: "Описание слишком длинное (макс. 1000 символов)" },
      { status: 400 },
    );
  }
  if (
    changeNote !== undefined &&
    typeof changeNote === "string" &&
    changeNote.length > 500
  ) {
    return NextResponse.json(
      { error: "Заметка об изменении слишком длинная (макс. 500 символов)" },
      { status: 400 },
    );
  }
  if (
    status !== undefined &&
    status !== "draft" &&
    status !== "published" &&
    status !== "scheduled"
  ) {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }
  if (tags !== undefined && !Array.isArray(tags)) {
    return NextResponse.json(
      { error: "Теги должны быть массивом" },
      { status: 400 },
    );
  }

  const validSaveModes = [
    "draft",
    "publish",
    "send_for_review",
    "notify_reviewer",
    "schedule",
  ] as const;
  type SaveMode = (typeof validSaveModes)[number];
  if (
    saveMode !== undefined &&
    (typeof saveMode !== "string" ||
      !validSaveModes.includes(saveMode as SaveMode))
  ) {
    return NextResponse.json(
      { error: "Недопустимый saveMode" },
      { status: 400 },
    );
  }

  // Validate scheduledAt for schedule mode
  if (saveMode === "schedule") {
    if (
      scheduledAt === undefined ||
      typeof scheduledAt !== "number" ||
      !Number.isInteger(scheduledAt)
    ) {
      return NextResponse.json(
        { error: "scheduledAt обязателен для saveMode=schedule" },
        { status: 400 },
      );
    }
    const nowTs = Math.floor(Date.now() / 1000);
    if (scheduledAt <= nowTs) {
      return NextResponse.json(
        { error: "Выберите дату в будущем" },
        { status: 400 },
      );
    }
  }

  if (saveMode === "send_for_review") {
    if (reviewerIds.length === 0) {
      return NextResponse.json(
        { error: "reviewerIds обязателен при saveMode=send_for_review" },
        { status: 400 },
      );
    }
  }

  if (changelog !== undefined) {
    if (!Array.isArray(changelog)) {
      return NextResponse.json(
        { error: "changelog должен быть массивом" },
        { status: 400 },
      );
    }
    for (const entry of changelog) {
      if (
        typeof entry.entryDate !== "number" ||
        !Number.isInteger(entry.entryDate) ||
        entry.entryDate <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Каждая запись changelog должна содержать entryDate (Unix seconds)",
          },
          { status: 400 },
        );
      }
      if (!entry.description || typeof entry.description !== "string") {
        return NextResponse.json(
          { error: "Каждая запись changelog должна содержать description" },
          { status: 400 },
        );
      }
    }
  }

  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Автор может редактировать только свои статьи
  if (!access.isAdmin && existing.authorId !== access.userId) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  // Автор не может публиковать или планировать, если заблокирован
  const isPublishing = status === "published" || saveMode === "publish";
  const isScheduling = saveMode === "schedule";
  if (!access.isAdmin && (isPublishing || isScheduling)) {
    const author = await db
      .select({ isBlocked: users.isBlocked })
      .from(users)
      .where(eq(users.id, access.userId!))
      .get();
    if (author?.isBlocked) {
      return NextResponse.json(
        { error: "Публикация заблокирована администратором" },
        { status: 403 },
      );
    }
  }

  // Check slug uniqueness if changed
  if (slug !== undefined && slug !== existing.slug) {
    if (!slug.trim()) {
      return NextResponse.json(
        { error: "Slug не может быть пустым" },
        { status: 400 },
      );
    }
    const conflict = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), ne(articles.id, id)))
      .get();
    if (conflict) {
      return NextResponse.json(
        { error: "Статья с таким slug уже существует" },
        { status: 409 },
      );
    }
  }

  // Guard for send_for_review: validate reviewers, check no active open session
  if (saveMode === "send_for_review") {
    const countError = validateReviewerCount(reviewerIds, existing.difficulty);
    if (countError) {
      return NextResponse.json({ error: countError }, { status: 400 });
    }

    for (const rid of reviewerIds) {
      if (typeof rid !== "string" || !rid) {
        return NextResponse.json({ error: "Некорректный reviewerId" }, { status: 400 });
      }
      const reviewer = await db
        .select({ id: users.id, role: users.role, isBlocked: users.isBlocked })
        .from(users)
        .where(eq(users.id, rid))
        .get();
      if (!reviewer || reviewer.role !== "reviewer") {
        return NextResponse.json({ error: "Ревьюер не найден" }, { status: 404 });
      }
      if (reviewer.isBlocked) {
        return NextResponse.json({ error: "Ревьюер заблокирован" }, { status: 400 });
      }
      // Проверить: нет активного назначения в открытой сессии
      const activeAssignment = await db
        .select({ id: reviewAssignments.id })
        .from(reviewAssignments)
        .where(
          and(
            eq(reviewAssignments.articleId, id),
            eq(reviewAssignments.reviewerId, rid),
            or(
              eq(reviewAssignments.status, "pending"),
              eq(reviewAssignments.status, "accepted"),
            ),
          ),
        )
        .get();
      if (activeAssignment) {
        return NextResponse.json(
          { error: "Уже есть активное назначение для этой пары статья/ревьюер" },
          { status: 409 },
        );
      }
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const wasPublished = existing.status === "published";

  // Save version snapshot BEFORE updating (convention: snapshot = state before change)
  const versionId = ulid();
  await db.insert(articleVersions).values({
    id: versionId,
    articleId: id,
    title: existing.title,
    content: existing.content,
    createdAt: now,
    changeNote: typeof changeNote === "string" ? changeNote : null,
  });

  try {
    await db
      .update(articles)
      .set({
        title: typeof title === "string" ? title : existing.title,
        slug: typeof slug === "string" ? slug : existing.slug,
        content: typeof content === "string" ? content : existing.content,
        excerpt: typeof excerpt === "string" ? excerpt : existing.excerpt,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : existing.tags,
        status: isPublishing
          ? "published"
          : isScheduling
            ? "scheduled"
            : ((typeof status === "string"
                ? (status as "draft" | "published" | "scheduled")
                : undefined) ?? existing.status),
        publishedAt: isPublishing && !wasPublished ? now : existing.publishedAt,
        scheduledAt: isPublishing
          ? null
          : isScheduling
            ? (scheduledAt as number)
            : saveMode === "draft"
              ? null
              : existing.scheduledAt,
        coverImageUrl:
          coverImageUrl === null
            ? null
            : typeof coverImageUrl === "string" &&
                coverImageUrl.startsWith("/uploads/")
              ? coverImageUrl
              : existing.coverImageUrl,
        difficulty:
          difficulty === null
            ? null
            : difficulty === "simple" ||
                difficulty === "medium" ||
                difficulty === "hard"
              ? difficulty
              : existing.difficulty,
        ogTitle:
          ogTitle === null
            ? null
            : typeof ogTitle === "string"
              ? ogTitle || null
              : existing.ogTitle,
        ogDescription:
          ogDescription === null
            ? null
            : typeof ogDescription === "string"
              ? ogDescription || null
              : existing.ogDescription,
        ogImage:
          ogImage === null
            ? null
            : typeof ogImage === "string"
              ? ogImage || null
              : existing.ogImage,
        updatedAt: now,
      })
      .where(eq(articles.id, id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Статья с таким slug уже существует" },
        { status: 409 },
      );
    }
    console.error("PUT /api/articles/[id] db.update failed:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  // notify_reviewer: фан-аут уведомлений всем активным ревьюерам открытой сессии
  if (saveMode === "notify_reviewer") {
    const openSession = await db
      .select({ id: reviewSessions.id })
      .from(reviewSessions)
      .where(
        and(
          eq(reviewSessions.articleId, id),
          eq(reviewSessions.status, "open"),
        ),
      )
      .orderBy(desc(reviewSessions.createdAt))
      .limit(1)
      .get();

    if (openSession) {
      const activeAssignments = await db
        .select({
          id: reviewAssignments.id,
          reviewerId: reviewAssignments.reviewerId,
        })
        .from(reviewAssignments)
        .where(
          and(
            eq(reviewAssignments.sessionId, openSession.id),
            or(
              eq(reviewAssignments.status, "pending"),
              eq(reviewAssignments.status, "accepted"),
            ),
          ),
        );

      if (activeAssignments.length > 0) {
        const notifValues = activeAssignments.map((a) => ({
          id: ulid(),
          recipientId: a.reviewerId,
          isAdminRecipient: 0,
          type: "article_updated" as const,
          payload: JSON.stringify({
            articleId: id,
            assignmentId: a.id,
            sessionId: openSession.id,
          }),
          isRead: 0,
          createdAt: now,
        }));
        await db.insert(notifications).values(notifValues);
      }
    }
  }

  // send_for_review: создать сессию + N назначений + уведомить ревьюеров
  if (saveMode === "send_for_review") {
    await createSessionWithAssignments({
      articleId: id,
      articleVersionId: versionId,
      reviewerIds,
      now,
    });
  }

  // Уведомить подписчиков при первой публикации статьи автора
  if (!wasPublished && isPublishing && existing.authorId) {
    const authorUser = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, existing.authorId))
      .get();

    const subs = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.authorId, existing.authorId));

    if (subs.length > 0) {
      const articleTitle = typeof title === "string" ? title : existing.title;
      const notifValues = subs.map((sub) => ({
        id: ulid(),
        recipientId: sub.userId,
        isAdminRecipient: 0,
        type: "new_article_by_subscribed_author" as const,
        payload: JSON.stringify({
          articleId: id,
          articleTitle,
          authorName: authorUser?.name ?? "",
        }),
        isRead: 0,
        createdAt: now,
      }));
      await db.insert(notifications).values(notifValues);
    }
  }

  // Уведомить подписчиков и читателей с закладками при обновлении опубликованной статьи
  if (wasPublished && saveMode === "publish") {
    const articleTitle = typeof title === "string" ? title : existing.title;

    // Подписчики на автора (только если статья принадлежит автору)
    let authorName = "";
    const subsSet = new Set<string>();
    if (existing.authorId) {
      const authorUser = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, existing.authorId))
        .get();
      authorName = authorUser?.name ?? "";

      const subs = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(eq(subscriptions.authorId, existing.authorId));
      for (const sub of subs) subsSet.add(sub.userId);
    }

    // Читатели, добавившие статью в закладки
    const bookmarkRows = await db
      .select({ userId: bookmarks.userId })
      .from(bookmarks)
      .where(eq(bookmarks.articleId, id));
    for (const bm of bookmarkRows) subsSet.add(bm.userId);

    if (subsSet.size > 0) {
      const payload = JSON.stringify({ articleId: id, articleTitle, authorName });
      const notifValues = Array.from(subsSet).map((userId) => ({
        id: ulid(),
        recipientId: userId,
        isAdminRecipient: 0,
        type: "article_updated_for_subscribers" as const,
        payload,
        isRead: 0,
        createdAt: now,
      }));
      await db.insert(notifications).values(notifValues);
    }
  }

  // publish with changelog entries
  if (
    (saveMode === "publish" || isPublishing) &&
    Array.isArray(changelog) &&
    changelog.length > 0
  ) {
    const entries = changelog.map(
      (entry: {
        entryDate: number;
        section?: string;
        description: string;
      }) => ({
        id: ulid(),
        articleId: id,
        entryDate: entry.entryDate,
        section: entry.section ?? null,
        description: entry.description,
        createdAt: now,
      }),
    );
    await db.insert(articleChangelog).values(entries);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await resolveAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Автор может удалять только свои статьи
  if (!access.isAdmin && existing.authorId !== access.userId) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await db.delete(articles).where(eq(articles.id, id));

  return NextResponse.json({ ok: true });
}
