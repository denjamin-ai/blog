"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewProgress } from "@/components/review/review-progress";
import { ReviewChecklist } from "@/components/review/review-checklist";
import { DiffView } from "@/components/review/diff-view";
import { VerdictModal } from "@/components/review/verdict-modal";

type Status = "pending" | "accepted" | "declined" | "completed";
type FilterMode = "all" | "open" | "resolved" | "unanswered";

interface Comment {
  id: string;
  assignmentId: string;
  authorId: string | null;
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
  assignmentId: string;
  status: Status;
  articleTitle: string;
  children: React.ReactNode;
}

const STATUS_LABELS: Record<Status, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_COLORS: Record<Status, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReviewAssignmentView({
  assignmentId,
  status: initialStatus,
  articleTitle,
  children,
}: Props) {
  const articleRef = useRef<HTMLElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>(initialStatus);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [quotedAnchor, setQuotedAnchor] = useState<string | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [pendingQuote, setPendingQuote] = useState<{
    text: string;
    anchor: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"article" | "diff">("article");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showVerdictModal, setShowVerdictModal] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/review-comments`,
      );
      if (res.ok) {
        const data = await res.json();
        setComments(
          [...data].sort((a: Comment, b: Comment) => a.createdAt - b.createdAt),
        );
      }
    } catch {
      // ignore
    }
  }, [assignmentId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Text selection → floating quote button
  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";

      if (!text || !articleRef.current?.contains(sel?.anchorNode ?? null)) {
        setFloatPos(null);
        setPendingQuote(null);
        return;
      }

      const range = sel!.getRangeAt(0);

      const headings = articleRef.current.querySelectorAll(
        "h1[id], h2[id], h3[id], h4[id]",
      );
      let anchor: string | null = null;
      for (const h of Array.from(headings).reverse()) {
        if (
          h.compareDocumentPosition(range.startContainer) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          anchor = (h as HTMLElement).id;
          break;
        }
      }

      const rect = range.getBoundingClientRect();
      setFloatPos({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 48,
      });
      setPendingQuote({ text, anchor });
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  function applyQuote() {
    if (!pendingQuote) return;
    setQuotedText(pendingQuote.text);
    setQuotedAnchor(pendingQuote.anchor);
    setFloatPos(null);
    setPendingQuote(null);
    window.getSelection()?.removeAllRanges();
    setTimeout(
      () => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/review-comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: commentText.trim(),
            quotedText: quotedText ?? undefined,
            quotedAnchor: quotedAnchor ?? undefined,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Ошибка отправки");
        return;
      }
      setCommentText("");
      setQuotedText(null);
      setQuotedAnchor(null);
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

  async function updateStatus(next: Status) {
    setError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reviewer/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Ошибка");
        return;
      }
      setStatus(next);
    } catch {
      setError("Ошибка сети");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopen(commentId: string) {
    setResolvingId(commentId);
    try {
      const res = await fetch(`/api/review-comments/${commentId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: false }),
      });
      if (res.ok) {
        await loadComments();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Ошибка переоткрытия");
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

  // «Без ответа»: reviewer-комментарий верхнего уровня, на который нет ни одного ответа admin
  const unansweredRootIds = new Set(
    comments
      .filter((c) => c.parentId === null && c.isAdminComment === 0)
      .filter(
        (c) =>
          !comments.some((r) => r.parentId === c.id && r.isAdminComment === 1),
      )
      .map((c) => c.id),
  );
  const unansweredCount = unansweredRootIds.size;

  const filteredComments = comments.filter((c) => {
    if (filterMode === "open") return c.resolvedAt === null;
    if (filterMode === "resolved") return c.resolvedAt !== null;
    if (filterMode === "unanswered") {
      // показываем сам комментарий и его реплаи
      return (
        unansweredRootIds.has(c.id) ||
        (c.parentId !== null && unansweredRootIds.has(c.parentId))
      );
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-57px)] -mx-4 -mt-8">
      {/* Article / Diff content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Content tab switcher */}
        <div className="flex gap-1 px-6 pt-4 pb-2 border-b border-border shrink-0">
          <button
            onClick={() => setContentTab("article")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              contentTab === "article"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Статья
          </button>
          <button
            onClick={() => setContentTab("diff")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              contentTab === "diff"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Изменения
          </button>
        </div>

        {contentTab === "article" ? (
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-8">{articleTitle}</h1>
            <article
              ref={articleRef}
              id="article-content"
              className="prose dark:prose-invert max-w-3xl"
            >
              {children}
            </article>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <DiffView assignmentId={assignmentId} />
          </div>
        )}
      </div>

      {/* Floating quote button */}
      {floatPos && pendingQuote && (
        <button
          onClick={applyQuote}
          style={{
            top: floatPos.y,
            left: floatPos.x,
            transform: "translateX(-50%)",
          }}
          className="fixed z-50 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:opacity-90 transition-opacity motion-safe:animate-fade-in"
        >
          Процитировать
        </button>
      )}

      {/* Comments panel */}
      <aside className="w-[400px] shrink-0 border-l border-border flex flex-col bg-background">
        {/* Status header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>

          {status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus("accepted")}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Принять
              </button>
              <button
                onClick={() => updateStatus("declined")}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          )}

          {status === "accepted" && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowVerdictModal(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Завершить
              </button>
              <button
                onClick={() => updateStatus("declined")}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalComments > 0 && (
          <div className="px-4 py-3 border-b border-border shrink-0">
            <ReviewProgress resolved={resolvedCount} total={totalComments} />
          </div>
        )}

        {/* Checklist */}
        <ReviewChecklist assignmentId={assignmentId} />

        {/* Filter bar */}
        {totalComments > 0 && (
          <div className="px-4 py-2 border-b border-border flex flex-wrap gap-1 shrink-0">
            {(
              [
                { key: "all", label: `Все (${totalComments})` },
                { key: "open", label: `Открытые (${openCount})` },
                { key: "resolved", label: `Решённые (${resolvedCount})` },
                {
                  key: "unanswered",
                  label: `Без ответа (${unansweredCount})`,
                },
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
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {filteredComments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              {totalComments === 0
                ? "Нет комментариев"
                : filterMode === "unanswered"
                  ? "Все замечания получили ответ"
                  : "Нет комментариев в этой категории"}
            </p>
          )}
          {filteredComments.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col gap-1 ${c.parentId ? "ml-4 pl-3 border-l-2 border-border" : ""}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium">
                  {c.isAdminComment ? "Редактор" : "Вы"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </span>
                {/* Resolved badge */}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    c.resolvedAt !== null
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {c.resolvedAt !== null ? "🟢 Решён" : "🔴 Открыт"}
                </span>
                {/* Reopen button for reviewer on resolved comments */}
                {c.resolvedAt !== null &&
                  !c.isAdminComment &&
                  (status === "pending" || status === "accepted") && (
                    <button
                      onClick={() => handleReopen(c.id)}
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
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment form */}
        {(status === "pending" || status === "accepted") && (
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
                  onClick={() => {
                    setQuotedText(null);
                    setQuotedAnchor(null);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs shrink-0"
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
              placeholder="Добавить комментарий…"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="self-end px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Отправка…" : "Отправить"}
            </button>
          </form>
        )}
      </aside>

      {/* Verdict modal */}
      {showVerdictModal && (
        <VerdictModal
          assignmentId={assignmentId}
          openComments={openCount}
          onClose={() => setShowVerdictModal(false)}
          onSuccess={() => {
            setShowVerdictModal(false);
            setStatus("completed");
          }}
        />
      )}
    </div>
  );
}
