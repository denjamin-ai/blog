import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// users объявлен первым, так как articles.authorId ссылается на него
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["reviewer", "reader", "author"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  // 1 = скрыть публикации автора с публичного сайта (только для role=author)
  isBlocked: integer("is_blocked").notNull().default(0),
  // 1 = запретить читателю оставлять комментарии (только для role=reader)
  commentingBlocked: integer("commenting_blocked").notNull().default(0),
  // Публичный профиль автора
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  // JSON: {"github":"...","telegram":"...","website":"..."}
  links: text("links"),
  // Для публичной страницы /authors/[slug]
  slug: text("slug").unique(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  status: text("status", { enum: ["draft", "published", "scheduled"] })
    .notNull()
    .default("draft"),
  publishedAt: integer("published_at"),
  scheduledAt: integer("scheduled_at"),
  // null = статья создана admin; ID = статья принадлежит автору (role=author)
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  coverImageUrl: text("cover_image_url"),
  difficulty: text("difficulty", { enum: ["simple", "medium", "hard"] }),
  viewCount: integer("view_count").notNull().default(0),
  // SEO / Open Graph overrides
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const articleVersions = sqliteTable("article_versions", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
  changeNote: text("change_note"),
});

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey().default("main"),
  name: text("name").notNull().default(""),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  links: text("links").notNull().default("{}"),
  // JSON: [{"text":"..."}] — шаблон чеклиста ревью, копируется при создании назначения
  checklistTemplate: text("checklist_template"),
  // Дефолтное OG-изображение для статей без обложки
  defaultOgImage: text("default_og_image"),
  updatedAt: integer("updated_at").notNull(),
});

export const profileVersions = sqliteTable("profile_versions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  links: text("links").notNull(),
  createdAt: integer("created_at").notNull(),
  changeNote: text("change_note"),
});

// --- Review & Comments System ---

export const reviewSessions = sqliteTable(
  "review_sessions",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    articleVersionId: text("article_version_id")
      .notNull()
      .references(() => articleVersions.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["open", "completed", "cancelled"] })
      .notNull()
      .default("open"),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (t) => [index("review_sessions_article_idx").on(t.articleId)],
);

export const reviewAssignments = sqliteTable(
  "review_assignments",
  {
    id: text("id").primaryKey(),
    // sessionId — nullable для миграции существующих данных; NOT NULL для новых записей
    sessionId: text("session_id").references(() => reviewSessions.id, {
      onDelete: "cascade",
    }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    articleVersionId: text("article_version_id")
      .notNull()
      .references(() => articleVersions.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "declined", "completed"],
    })
      .notNull()
      .default("pending"),
    reviewerNote: text("reviewer_note"),
    // Вердикт — заполняется при status=completed
    verdict: text("verdict", {
      enum: ["approved", "needs_work", "rejected"],
    }),
    verdictNote: text("verdict_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("review_assignments_article_reviewer_idx").on(
      t.articleId,
      t.reviewerId,
    ),
    index("review_assignments_reviewer_idx").on(t.reviewerId),
    index("review_assignments_session_idx").on(t.sessionId),
  ],
);

export const reviewChecklists = sqliteTable("review_checklists", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => reviewAssignments.id, { onDelete: "cascade" }),
  // JSON: [{"text":"...","checked":false}]
  items: text("items").notNull().default("[]"),
  createdAt: integer("created_at").notNull(),
});

export const reviewComments = sqliteTable("review_comments", {
  id: text("id").primaryKey(),
  // sessionId — привязка к сессии (общий чат); NULL для старых записей через миграцию
  sessionId: text("session_id").references(() => reviewSessions.id, {
    onDelete: "cascade",
  }),
  // assignmentId — сохраняется для трассируемости (nullable, без FK после миграции)
  assignmentId: text("assignment_id"),
  // NULL = написал admin; 1 = написал admin (взаимно с authorId)
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  isAdminComment: integer("is_admin_comment").notNull().default(0),
  content: text("content").notNull(),
  quotedText: text("quoted_text"),
  // JSON: { "paragraphIndex": N, "charStart": N, "charEnd": N }
  quotedAnchor: text("quoted_anchor"),
  // self-reference — 1 уровень вложенности, проверка на уровне приложения
  parentId: text("parent_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  // Разрешение замечания: null = открыт, not null = решён
  resolvedAt: integer("resolved_at"),
  resolvedBy: text("resolved_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const publicComments = sqliteTable(
  "public_comments",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // RESTRICT: нельзя удалить версию, к которой привязаны комментарии
    articleVersionId: text("article_version_id")
      .notNull()
      .references(() => articleVersions.id, { onDelete: "restrict" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    // self-reference — макс. 2 уровня вложенности, проверка на уровне приложения
    parentId: text("parent_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    // мягкое удаление: контент скрывается, показывается «[удалено]»
    deletedAt: integer("deleted_at"),
  },
  (t) => [
    index("public_comments_article_idx").on(t.articleId),
    index("public_comments_author_idx").on(t.authorId),
  ],
);

export const articleChangelog = sqliteTable("article_changelog", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  entryDate: integer("entry_date").notNull(),
  section: text("section"),
  description: text("description").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    // NULL = получатель admin; не-NULL = ID пользователя
    recipientId: text("recipient_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    isAdminRecipient: integer("is_admin_recipient").notNull().default(0),
    type: text("type", {
      enum: [
        "assignment_created",
        "assignment_accepted",
        "assignment_declined",
        "review_completed",
        "review_comment_reply",
        "review_comment_reopened",
        "public_comment_reply",
        "article_updated",
        "article_hidden",
        "new_article_by_subscribed_author",
        "article_updated_for_subscribers",
      ],
    }).notNull(),
    // JSON с контекстными ID для deep link; читать через JSON.parse с try-catch
    payload: text("payload").notNull().default("{}"),
    isRead: integer("is_read").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("notifications_recipient_read_idx").on(t.recipientId, t.isRead),
    index("notifications_admin_read_idx").on(t.isAdminRecipient, t.isRead),
  ],
);

// --- Reader Engagement ---

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("bookmarks_user_idx").on(t.userId),
    uniqueIndex("bookmarks_user_article_uidx").on(t.userId, t.articleId),
  ],
);

export const articleVotes = sqliteTable(
  "article_votes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // +1 или -1
    value: integer("value").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("article_votes_article_idx").on(t.articleId),
    uniqueIndex("article_votes_user_article_uidx").on(t.userId, t.articleId),
  ],
);

export const commentVotes = sqliteTable(
  "comment_votes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => publicComments.id, { onDelete: "cascade" }),
    // +1 или -1
    value: integer("value").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("comment_votes_comment_idx").on(t.commentId),
    uniqueIndex("comment_votes_user_comment_uidx").on(t.userId, t.commentId),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    // читатель
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // автор
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    uniqueIndex("subscriptions_user_author_uidx").on(t.userId, t.authorId),
  ],
);
