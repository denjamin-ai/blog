"use client";

import { useState, useEffect, useCallback } from "react";
import { VerdictBadge } from "@/components/review/verdict-badge";
import { DiffView } from "@/components/review/diff-view";
import { ReviewChecklist } from "@/components/review/review-checklist";

interface ReviewComment {
  id: string;
  assignmentId: string;
  authorId: string | null;
  isAdminComment: number;
  content: string;
  quotedText: string | null;
  parentId: string | null;
  createdAt: number;
}

interface AssignmentThreadProps {
  assignmentId: string;
  reviewerName: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: number;
  verdict?: string | null;
  verdictNote?: string | null;
}

const STATUS_LABELS: Record<AssignmentThreadProps["status"], string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_CLASSES: Record<AssignmentThreadProps["status"], string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

export default function AssignmentThread({
  assignmentId,
  reviewerName,
  status: initialStatus,
  createdAt,
  verdict,
  verdictNote,
}: AssignmentThreadProps) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [status, setStatus] =
    useState<AssignmentThreadProps["status"]>(initialStatus);
  const [closing, setClosing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/review-comments`,
      );
      if (res.ok) {
        const data: ReviewComment[] = await res.json();
        // Sort oldest first for thread reading
        setComments(data.sort((a, b) => a.createdAt - b.createdAt));
      }
    } catch {
      // ignore
    } finally {
      setLastUpdated(new Date());
      setCommentsLoaded(true);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadComments();
    const interval = setInterval(loadComments, 15_000);
    return () => clearInterval(interval);
  }, [loadComments]);

  async function handleSubmitReply() {
    if (!replyContent.trim()) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const body: { content: string; parentId?: string } = {
        content: replyContent.trim(),
      };
      if (replyTo) body.parentId = replyTo;

      const res = await fetch(
        `/api/assignments/${assignmentId}/review-comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (res.ok) {
        setReplyContent("");
        setReplyTo(null);
        await loadComments();
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Ошибка отправки");
      }
    } catch {
      setSubmitError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    if (!confirm("Закрыть это ревью? Статус изменится на «Завершено».")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setStatus("completed");
      }
    } catch {
      // ignore
    } finally {
      setClosing(false);
    }
  }

  const replyingToComment = replyTo
    ? comments.find((c) => c.id === replyTo)
    : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
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
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              обновлено{" "}
              {lastUpdated.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={loadComments}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Обновить
          </button>
          <button
            onClick={() => setShowDiff((v) => !v)}
            className="text-xs px-2 py-1 border border-border rounded hover:bg-muted transition-colors"
          >
            {showDiff ? "Скрыть изменения" : "Показать изменения"}
          </button>
          {status !== "completed" && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="text-xs px-2 py-1 border border-border rounded hover:bg-muted transition-colors disabled:opacity-50"
            >
              {closing ? "Закрытие..." : "Закрыть ревью"}
            </button>
          )}
        </div>
      </div>

      {/* Verdict note */}
      {verdictNote && (
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Резюме ревьюера:</p>
          <p className="text-sm whitespace-pre-wrap">{verdictNote}</p>
        </div>
      )}

      {/* Diff view */}
      {showDiff && (
        <div className="border-t border-border max-h-96 overflow-y-auto">
          <DiffView
            assignmentId={assignmentId}
            diffUrl={`/api/admin/assignments/${assignmentId}/diff`}
          />
        </div>
      )}

      {/* Checklist (read-only) */}
      <div className="border-t border-border">
        <ReviewChecklist assignmentId={assignmentId} readOnly />
      </div>

      {/* Comments thread */}
      <div className="px-4 py-3 space-y-3">
        {!commentsLoaded && (
          <p className="text-sm text-muted-foreground">
            Загрузка комментариев...
          </p>
        )}
        {commentsLoaded && comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Комментариев пока нет</p>
        )}
        {comments.map((comment) => {
          const isAdmin = comment.isAdminComment === 1;
          const isReply = !!comment.parentId;
          return (
            <div
              key={comment.id}
              className={`text-sm ${isReply ? "ml-6 border-l-2 border-border pl-3" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-medium ${isAdmin ? "text-accent" : "text-foreground"}`}
                >
                  {isAdmin ? "Вы (admin)" : reviewerName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt * 1000).toLocaleString("ru-RU")}
                </span>
                {!isReply && status !== "completed" && (
                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {replyTo === comment.id ? "Отмена" : "Ответить"}
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

      {/* Reply form */}
      {status !== "completed" && (
        <div className="border-t border-border px-4 py-3">
          {replyingToComment && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <span>Ответ на:</span>
              <span className="italic truncate max-w-[200px]">
                {replyingToComment.content}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            placeholder="Напишите ответ..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {submitError && (
            <p className="text-danger text-xs mt-1">{submitError}</p>
          )}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitReply}
              disabled={submitting || !replyContent.trim()}
              className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
