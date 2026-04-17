"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewProgress } from "@/components/review/review-progress";
import type { ReviewSessionStatus } from "@/types";

type FilterMode = "all" | "open" | "resolved";

interface SessionComment {
  id: string;
  sessionId: string | null;
  assignmentId: string | null;
  authorId: string | null;
  authorName: string | null;
  isAdminComment: number;
  content: string;
  quotedText: string | null;
  quotedAnchor: string | null;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
  resolvedBy: string | null;
}

interface Props {
  sessionId: string;
  sessionStatus: ReviewSessionStatus;
  currentUserId: string | null;
  isAdmin: boolean;
  /** Когда true — пользователь является автором статьи (только чтение) */
  isAuthor?: boolean;
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionReviewThread({
  sessionId,
  sessionStatus,
  currentUserId,
  isAdmin,
  isAuthor = false,
}: Props) {
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<SessionComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const canWrite = sessionStatus === "open" && !isAuthor;

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/review-comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(
          [...data].sort(
            (a: SessionComment, b: SessionComment) => a.createdAt - b.createdAt,
          ),
        );
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  function getAuthorLabel(c: SessionComment): string {
    if (c.isAdminComment) return "Редактор";
    if (currentUserId && c.authorId === currentUserId) return "Вы";
    return c.authorName ?? "Ревьюер";
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/review-comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: commentText.trim(),
            quotedText: quotedText ?? undefined,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Ошибка отправки");
        return;
      }
      setCommentText("");
      setQuotedText(null);
      await loadComments();
      setTimeout(
        () => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolveToggle(commentId: string, resolve: boolean) {
    setResolvingId(commentId);
    try {
      const res = await fetch(`/api/review-comments/${commentId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: resolve }),
      });
      if (res.ok) {
        await loadComments();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Ошибка");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setResolvingId(null);
    }
  }

  const totalComments = comments.length;
  const resolvedCount = comments.filter((c) => c.resolvedAt !== null).length;
  const openCount = totalComments - resolvedCount;

  const filteredComments = comments.filter((c) => {
    if (filterMode === "open") return c.resolvedAt === null;
    if (filterMode === "resolved") return c.resolvedAt !== null;
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Session status banner */}
      {sessionStatus !== "open" && (
        <div className="px-4 py-2 bg-muted/40 border-b border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            {sessionStatus === "completed"
              ? "Сессия ревью завершена — чат закрыт"
              : "Сессия ревью отменена"}
          </p>
        </div>
      )}

      {/* Progress */}
      {totalComments > 0 && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <ReviewProgress resolved={resolvedCount} total={totalComments} />
        </div>
      )}

      {/* Filter bar */}
      {totalComments > 0 && (
        <div className="px-4 py-2 border-b border-border flex flex-wrap gap-1 shrink-0">
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
      )}

      {/* Comments thread */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {filteredComments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            {totalComments === 0
              ? "Нет комментариев"
              : "Нет комментариев в этой категории"}
          </p>
        )}
        {filteredComments.map((c) => {
          const isResolved = c.resolvedAt !== null;
          const isOwnComment =
            (isAdmin && c.isAdminComment) ||
            (!isAdmin && currentUserId && c.authorId === currentUserId);

          const canResolve =
            sessionStatus === "open" &&
            !isResolved &&
            (isAdmin || isAuthor);
          const canReopen =
            sessionStatus === "open" &&
            isResolved &&
            (isAdmin || isOwnComment);

          return (
            <div
              key={c.id}
              className={`flex flex-col gap-1 ${c.parentId ? "ml-4 pl-3 border-l-2 border-border" : ""}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold">
                  {getAuthorLabel(c)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    isResolved
                      ? "bg-success-bg text-success"
                      : "bg-danger-bg text-danger"
                  }`}
                >
                  {isResolved ? "Решён" : "Открыт"}
                </span>
                {canResolve && (
                  <button
                    onClick={() => handleResolveToggle(c.id, true)}
                    disabled={resolvingId === c.id}
                    className="text-xs text-muted-foreground hover:text-success transition-colors disabled:opacity-50"
                  >
                    Отметить решённым
                  </button>
                )}
                {canReopen && (
                  <button
                    onClick={() => handleResolveToggle(c.id, false)}
                    disabled={resolvingId === c.id}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Переоткрыть
                  </button>
                )}
              </div>
              {c.quotedText && (
                <blockquote className="border-l-4 border-accent/40 pl-3 text-xs text-muted-foreground italic truncate">
                  {c.quotedText}
                </blockquote>
              )}
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          );
        })}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment form */}
      {canWrite && (
        <form
          onSubmit={submitComment}
          className="border-t border-border px-4 py-3 flex flex-col gap-2 shrink-0"
        >
          {quotedText && (
            <div className="flex items-start gap-2">
              <blockquote className="flex-1 border-l-4 border-accent/50 pl-3 text-xs text-muted-foreground italic line-clamp-2">
                {quotedText}
              </blockquote>
              <button
                type="button"
                onClick={() => setQuotedText(null)}
                className="text-muted-foreground hover:text-foreground text-xs shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label="Убрать цитату"
              >
                ✕
              </button>
            </div>
          )}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Добавить комментарий в общий чат…"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
          />
          {error && <p className="text-danger text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="self-end px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Отправка…" : "Отправить"}
          </button>
        </form>
      )}

      {/* Read-only notice for authors */}
      {isAuthor && sessionStatus === "open" && (
        <div className="border-t border-border px-4 py-3 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Вы можете читать обсуждение ревью, но не можете писать в него
          </p>
        </div>
      )}
    </div>
  );
}
