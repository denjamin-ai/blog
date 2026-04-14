"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewProgress } from "@/components/review/review-progress";
import { ReviewChecklist } from "@/components/review/review-checklist";
import { VerdictBadge } from "@/components/review/verdict-badge";

interface ReviewComment {
  id: string;
  assignmentId: string;
  authorId: string | null;
  isAdminComment: number;
  content: string;
  quotedText: string | null;
  parentId: string | null;
  createdAt: number;
  resolvedAt: number | null;
  resolvedBy: string | null;
}

interface Props {
  assignmentId: string;
  reviewerName: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: number;
  verdict: string | null;
  verdictNote: string | null;
}

const STATUS_LABELS: Record<Props["status"], string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_CLASSES: Record<Props["status"], string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

type FilterMode = "all" | "open" | "resolved";

export default function AuthorAssignmentThread({
  assignmentId,
  reviewerName,
  status,
  createdAt,
  verdict,
  verdictNote,
}: Props) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/review-comments`,
      );
      if (res.ok) {
        const data: ReviewComment[] = await res.json();
        setComments(data.sort((a, b) => a.createdAt - b.createdAt));
      }
    } catch {
      // ignore
    } finally {
      setCommentsLoaded(true);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleResolve(commentId: string, resolved: boolean) {
    setResolvingId(commentId);
    setResolveError("");
    try {
      const res = await fetch(`/api/review-comments/${commentId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      });
      if (res.ok) {
        await loadComments();
      } else {
        const d = await res.json().catch(() => ({}));
        setResolveError(d.error || "Ошибка");
      }
    } catch {
      setResolveError("Ошибка сети");
    } finally {
      setResolvingId(null);
    }
  }

  const totalComments = comments.length;
  const resolvedCount = comments.filter((c) => c.resolvedAt !== null).length;
  const openCount = totalComments - resolvedCount;

  const isActive = status === "pending" || status === "accepted";

  const filteredComments = comments.filter((c) => {
    if (filterMode === "open") return c.resolvedAt === null;
    if (filterMode === "resolved") return c.resolvedAt !== null;
    return true;
  });

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm">{reviewerName}</span>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {verdict && <VerdictBadge verdict={verdict} />}
          <span className="text-xs text-muted-foreground">
            {new Date(createdAt * 1000).toLocaleDateString("ru-RU")}
          </span>
        </div>
        <button
          onClick={loadComments}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Verdict note */}
      {verdictNote && (
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Резюме ревьюера:</p>
          <p className="text-sm whitespace-pre-wrap">{verdictNote}</p>
        </div>
      )}

      {/* Checklist (read-only) */}
      <ReviewChecklist assignmentId={assignmentId} readOnly />

      {/* Progress + filters */}
      {commentsLoaded && totalComments > 0 && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <ReviewProgress resolved={resolvedCount} total={totalComments} />
          <div className="flex gap-1">
            {(
              [
                { key: "all", label: `Все (${totalComments})` },
                { key: "open", label: `Открытые (${openCount})` },
                { key: "resolved", label: `Решённые (${resolvedCount})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterMode(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterMode === key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="px-4 py-3 space-y-3">
        {!commentsLoaded && (
          <p className="text-sm text-muted-foreground">
            Загрузка комментариев...
          </p>
        )}
        {commentsLoaded && totalComments === 0 && (
          <p className="text-sm text-muted-foreground">Комментариев пока нет</p>
        )}
        {commentsLoaded &&
          totalComments > 0 &&
          filteredComments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Нет комментариев в этой категории
            </p>
          )}
        {filteredComments.map((comment) => {
          const isAdminComment = comment.isAdminComment === 1;
          const isReply = !!comment.parentId;
          const isResolved = comment.resolvedAt !== null;

          return (
            <div
              key={comment.id}
              className={`text-sm ${isReply ? "ml-6 border-l-2 border-border pl-3" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`font-medium ${isAdminComment ? "text-accent" : "text-foreground"}`}
                >
                  {isAdminComment ? "Редактор" : reviewerName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt * 1000).toLocaleString("ru-RU")}
                </span>
                {/* Resolved badge */}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isResolved
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {isResolved ? "🟢 Решён" : "🔴 Открыт"}
                </span>
                {/* "Решено" button: author can mark reviewer comments as resolved.
                    Author cannot reopen (US-RV20 — only reviewer reopens). */}
                {isActive && !isReply && !isAdminComment && !isResolved && (
                  <button
                    onClick={() => handleResolve(comment.id, true)}
                    disabled={resolvingId === comment.id}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {resolvingId === comment.id ? "..." : "Решено"}
                  </button>
                )}
              </div>
              {comment.quotedText && (
                <blockquote className="border-l-2 border-muted-foreground/40 pl-2 text-muted-foreground italic mb-1">
                  {comment.quotedText}
                </blockquote>
              )}
              <p className="text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          );
        })}
      </div>

      {resolveError && (
        <div className="px-4 pb-3">
          <p className="text-red-500 text-xs">{resolveError}</p>
        </div>
      )}
    </div>
  );
}
