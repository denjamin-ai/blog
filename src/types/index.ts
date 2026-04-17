// Централизованные TypeScript-типы проекта
// Используются в src/lib/, src/app/api/, src/components/

// ---------------------------------------------------------------------------
// Пользователи и аутентификация
// ---------------------------------------------------------------------------

export type UserRole = "reviewer" | "reader" | "author";

export interface SessionData {
  isAdmin: boolean;
  userId?: string;
  userRole?: UserRole;
}

// ---------------------------------------------------------------------------
// Статьи
// ---------------------------------------------------------------------------

export type ArticleStatus = "draft" | "published" | "scheduled";

export type DifficultyLevel = "simple" | "medium" | "hard";

// ---------------------------------------------------------------------------
// Ревью
// ---------------------------------------------------------------------------

export type ReviewAssignmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed";

export type ReviewVerdict = "approved" | "needs_work" | "rejected";

export type ReviewSessionStatus = "open" | "completed" | "cancelled";

export interface ReviewSession {
  id: string;
  articleId: string;
  articleVersionId: string;
  status: ReviewSessionStatus;
  createdAt: number;
  completedAt: number | null;
}

export interface ReviewSessionAssignment {
  id: string;
  sessionId: string | null;
  reviewerId: string;
  reviewerName: string | null;
  reviewerUsername: string | null;
  status: ReviewAssignmentStatus;
  verdict: ReviewVerdict | null;
  verdictNote: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewSessionWithAssignments extends ReviewSession {
  assignments: ReviewSessionAssignment[];
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

// ---------------------------------------------------------------------------
// Уведомления
// ---------------------------------------------------------------------------

export type NotificationType =
  | "assignment_created"
  | "assignment_accepted"
  | "assignment_declined"
  | "review_completed"
  | "review_comment_reply"
  | "review_comment_reopened"
  | "public_comment_reply"
  | "article_updated"
  | "article_hidden"
  | "new_article_by_subscribed_author"
  | "article_updated_for_subscribers"
  | "review_submitted"
  | "suggestion_applied";

// ---------------------------------------------------------------------------
// Вспомогательные типы API
// ---------------------------------------------------------------------------

/** Ответ с ошибкой от API */
export interface ApiError {
  error: string;
}

/** Пагинация (для будущего использования) */
export interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Inline Review — anchoring
// ---------------------------------------------------------------------------

export type AnchorType = "text" | "block" | "general";

export type CommentType = "comment" | "suggestion";

export interface TextQuoteSelector {
  type: "TextQuoteSelector";
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface TextPositionSelector {
  type: "TextPositionSelector";
  start: number;
  end: number;
}

export interface AnchorData {
  anchorType: AnchorType;
  anchorId?: string;
  selectors: (TextQuoteSelector | TextPositionSelector)[];
  mdxSourceOffset?: { start: number; end: number };
}
