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
  | "review_assigned"
  | "review_accepted"
  | "review_declined"
  | "review_completed"
  | "review_comment"
  | "article_updated"
  | "new_article_by_subscribed_author";

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
