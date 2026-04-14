import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  articles,
  articleVersions,
  publicComments,
  commentVotes,
  notifications,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc, desc, inArray, sql } from "drizzle-orm";
import { ulid } from "ulid";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  const offset = (page - 1) * limit;

  // Publicly accessible — no auth required, but read session for userVote
  const session = await getSession();

  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Get current published version for stale detection
  const currentVersion = await db
    .select({ id: articleVersions.id })
    .from(articleVersions)
    .where(eq(articleVersions.articleId, id))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1)
    .get();

  const currentVersionId = currentVersion?.id ?? null;
  const compareVersionId = versionId ?? currentVersionId;

  // Count total root comments for pagination metadata
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(publicComments)
    .where(
      sql`${publicComments.articleId} = ${id} AND ${publicComments.parentId} IS NULL`,
    );

  const totalPages = Math.ceil(total / limit);

  // Fetch paginated root comments (parentId IS NULL), oldest first
  const roots = await db
    .select({
      id: publicComments.id,
      articleId: publicComments.articleId,
      articleVersionId: publicComments.articleVersionId,
      authorId: publicComments.authorId,
      authorName: users.name,
      content: publicComments.content,
      parentId: publicComments.parentId,
      createdAt: publicComments.createdAt,
      updatedAt: publicComments.updatedAt,
      deletedAt: publicComments.deletedAt,
    })
    .from(publicComments)
    .leftJoin(users, eq(publicComments.authorId, users.id))
    .where(
      sql`${publicComments.articleId} = ${id} AND ${publicComments.parentId} IS NULL`,
    )
    .orderBy(asc(publicComments.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch all replies for those root comments
  let replies: typeof roots = [];
  if (roots.length > 0) {
    const rootIds = roots.map((r) => r.id);
    replies = await db
      .select({
        id: publicComments.id,
        articleId: publicComments.articleId,
        articleVersionId: publicComments.articleVersionId,
        authorId: publicComments.authorId,
        authorName: users.name,
        content: publicComments.content,
        parentId: publicComments.parentId,
        createdAt: publicComments.createdAt,
        updatedAt: publicComments.updatedAt,
        deletedAt: publicComments.deletedAt,
      })
      .from(publicComments)
      .leftJoin(users, eq(publicComments.authorId, users.id))
      .where(inArray(publicComments.parentId, rootIds))
      .orderBy(asc(publicComments.createdAt));
  }

  const allRows = [...roots, ...replies];
  const allCommentIds = allRows.map((c) => c.id);

  // Голоса: рейтинг и голос текущего пользователя
  let votesByComment: Map<string, { rating: number; userVote: 1 | -1 | null }> =
    new Map();

  if (allCommentIds.length > 0) {
    const allVotes = await db
      .select({
        commentId: commentVotes.commentId,
        userId: commentVotes.userId,
        value: commentVotes.value,
      })
      .from(commentVotes)
      .where(inArray(commentVotes.commentId, allCommentIds));

    for (const cid of allCommentIds) {
      const votes = allVotes.filter((v) => v.commentId === cid);
      const rating = votes.reduce((acc, v) => acc + v.value, 0);
      const myVote = session.userId
        ? ((votes.find((v) => v.userId === session.userId)?.value as
            | 1
            | -1
            | undefined) ?? null)
        : null;
      votesByComment.set(cid, { rating, userVote: myVote });
    }
  }

  const comments = allRows.map((c) => ({
    ...c,
    authorName: c.deletedAt ? null : (c.authorName ?? "Аноним"),
    content: c.deletedAt ? null : c.content,
    isStale: compareVersionId ? c.articleVersionId !== compareVersionId : false,
    rating: votesByComment.get(c.id)?.rating ?? 0,
    userVote: votesByComment.get(c.id)?.userVote ?? null,
  }));

  return NextResponse.json({ comments, total, page, totalPages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await getSession();
  if (
    !session.userId ||
    (session.userRole !== "reader" && session.userRole !== "author")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Проверяем, не заблокирован ли пользователь от комментирования
  const commenter = await db
    .select({ commentingBlocked: users.commentingBlocked })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();
  if (commenter?.commentingBlocked) {
    return NextResponse.json(
      { error: "Вам запрещено оставлять комментарии" },
      { status: 403 },
    );
  }

  let body: { content?: unknown; parentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Неверный формат запроса" },
      { status: 400 },
    );
  }

  const { content, parentId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content обязателен" }, { status: 400 });
  }
  if (content.length > 10000) {
    return NextResponse.json(
      { error: "Комментарий слишком длинный" },
      { status: 400 },
    );
  }

  // Article must be published
  const article = await db
    .select({
      id: articles.id,
      status: articles.status,
      authorId: articles.authorId,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (article.status !== "published") {
    return NextResponse.json(
      { error: "Статья не опубликована" },
      { status: 403 },
    );
  }

  // Validate depth (max 2 levels)
  if (parentId !== undefined) {
    if (typeof parentId !== "string") {
      return NextResponse.json(
        { error: "Недопустимый parentId" },
        { status: 400 },
      );
    }
    const parent = await db
      .select({
        articleId: publicComments.articleId,
        parentId: publicComments.parentId,
      })
      .from(publicComments)
      .where(eq(publicComments.id, parentId))
      .get();

    if (!parent || parent.articleId !== id) {
      return NextResponse.json(
        { error: "Родительский комментарий не найден" },
        { status: 400 },
      );
    }
    if (parent.parentId !== null) {
      return NextResponse.json(
        { error: "Максимальная глубина вложенности — 2 уровня" },
        { status: 400 },
      );
    }
  }

  // Get current version
  const currentVersion = await db
    .select({ id: articleVersions.id })
    .from(articleVersions)
    .where(eq(articleVersions.articleId, id))
    .orderBy(desc(articleVersions.createdAt))
    .limit(1)
    .get();

  if (!currentVersion) {
    return NextResponse.json(
      { error: "Версия статьи не найдена" },
      { status: 500 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const commentId = ulid();

  await db.insert(publicComments).values({
    id: commentId,
    articleId: id,
    articleVersionId: currentVersion.id,
    authorId: session.userId,
    content: content.trim(),
    parentId: typeof parentId === "string" ? parentId : null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  // Notify parent author on reply
  if (parentId) {
    const parent = await db
      .select({ authorId: publicComments.authorId })
      .from(publicComments)
      .where(eq(publicComments.id, parentId as string))
      .get();

    if (parent && parent.authorId && parent.authorId !== session.userId) {
      await db.insert(notifications).values({
        id: ulid(),
        recipientId: parent.authorId,
        isAdminRecipient: 0,
        type: "public_comment_reply",
        payload: JSON.stringify({
          articleId: id,
          commentId,
          isAuthorReply:
            session.userRole === "author" &&
            article.authorId === session.userId,
        }),
        isRead: 0,
        createdAt: now,
      });
    }
  }

  return NextResponse.json({ id: commentId }, { status: 201 });
}
