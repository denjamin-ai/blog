"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveAnchor } from "@/lib/anchoring";
import {
  useReviewContext,
  type ReviewThread as ReviewThreadType,
  type ReviewComment,
} from "./review-context";
import type { AnchorData } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseAnchorData(json: string | null): AnchorData | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AnchorData;
  } catch {
    return null;
  }
}

function getQuotedText(comment: ReviewComment): string | null {
  // New anchor system: extract exact text from selectors
  const anchor = parseAnchorData(comment.anchorData);
  if (anchor) {
    const quote = anchor.selectors.find(
      (s) => s.type === "TextQuoteSelector",
    );
    if (quote && "exact" in quote) return quote.exact;
  }
  // Legacy: quotedText field
  return comment.quotedText;
}

function getAuthorLabel(comment: ReviewComment, isAdmin: boolean): string {
  if (comment.isAdminComment) return "Редактор";
  if (comment.authorName) return comment.authorName;
  if (isAdmin) return "Ревьюер";
  return "Вы";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  thread: ReviewThreadType;
  pinNumber: number;
}

export function ReviewThreadComponent({ thread, pinNumber }: Props) {
  const {
    activeThreadId,
    setActiveThreadId,
    permissions,
    orphanIds,
    articleRef,
    assignmentId,
    assignmentStatus,
    refreshComments,
    currentUserId,
    scrollingFromRef,
    unified,
    showToast,
  } = useReviewContext();

  const { root, replies } = thread;
  const isActive = activeThreadId === root.id;
  const isOrphan = orphanIds.has(root.id);
  const isSuggestion = root.commentType === "suggestion";
  const isApplied = root.appliedAt !== null;
  const isBatchPending = root.batchId !== null;

  const threadRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyConflict, setApplyConflict] = useState<{
    original: string;
    suggestion: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scroll into view when activated from highlight/pin click
  useEffect(() => {
    if (isActive && threadRef.current && scrollingFromRef.current !== "sidebar") {
      threadRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, scrollingFromRef]);

  // Click quoted text → scroll article to anchor
  const scrollToAnchor = useCallback(() => {
    const container = articleRef.current;
    if (!container) return;
    const anchor = parseAnchorData(root.anchorData);
    if (!anchor) return;
    const range = resolveAnchor(anchor, container);
    if (!range) return;

    scrollingFromRef.current = "sidebar";
    setActiveThreadId(root.id);

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollParent = container.closest(".overflow-y-auto") ?? container.parentElement;
    if (scrollParent) {
      scrollParent.scrollTo({
        top: scrollParent.scrollTop + rect.top - containerRect.top - 100,
        behavior: "smooth",
      });
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
      scrollingFromRef.current = null;
    }, 500);
  }, [articleRef, root.anchorData, root.id, setActiveThreadId, scrollingFromRef]);

  // Resolve / reopen
  const handleResolve = useCallback(
    async (commentId: string, resolved: boolean) => {
      setResolvingId(commentId);
      setError(null);
      try {
        const res = await fetch(`/api/review-comments/${commentId}/resolve`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved }),
        });
        if (res.ok) {
          await refreshComments();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Ошибка");
        }
      } catch {
        setError("Ошибка сети");
      } finally {
        setResolvingId(null);
      }
    },
    [refreshComments],
  );

  // Apply suggestion
  const handleApplySuggestion = useCallback(
    async (comment: ReviewComment) => {
      setApplyingId(comment.id);
      setError(null);
      setApplyConflict(null);
      try {
        const res = await fetch(
          `/api/review-comments/${comment.id}/apply-suggestion`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (res.ok) {
          await refreshComments();
          showToast("Правка применена");
        } else if (res.status === 409) {
          showToast("Правка уже применена", "error");
          await refreshComments();
        } else if (res.status === 422) {
          // Content changed — show conflict with original + suggestion
          setApplyConflict({
            original: getQuotedText(comment) ?? "",
            suggestion: comment.suggestionText ?? "",
          });
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Ошибка применения");
          showToast(d.error ?? "Ошибка применения", "error");
        }
      } catch {
        setError("Ошибка сети");
        showToast("Ошибка сети", "error");
      } finally {
        setApplyingId(null);
      }
    },
    [refreshComments, showToast],
  );

  // Reply
  const handleReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyText.trim()) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/assignments/${assignmentId}/review-comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: replyText.trim(),
              parentId: root.id,
            }),
          },
        );
        if (res.ok) {
          setReplyText("");
          await refreshComments();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Ошибка отправки");
        }
      } catch {
        setError("Ошибка сети");
      } finally {
        setSubmitting(false);
      }
    },
    [replyText, assignmentId, root.id, refreshComments],
  );

  const quotedText = getQuotedText(root);
  const isResolved = root.resolvedAt !== null;
  const canInteract =
    assignmentStatus === "pending" || assignmentStatus === "accepted";

  // Left-border color by status (applied > resolved > orphan > batch > open)
  const borderClass = isApplied
    ? "border-l-success"
    : isResolved
      ? "border-l-success/60"
      : isOrphan
        ? "border-l-danger"
        : isBatchPending
          ? "border-l-muted"
          : "border-l-warning";

  // Subtle card bg on applied + active
  const bgClass = isApplied
    ? "bg-success-bg/30"
    : isActive
      ? "bg-accent/5"
      : isResolved
        ? "bg-muted/10"
        : "";

  // Pin with checkmark for applied
  const pinClass = isActive
    ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background"
    : isApplied
      ? "bg-success text-background"
      : isResolved
        ? "bg-muted text-muted-foreground"
        : "bg-accent text-accent-foreground";

  return (
    <div
      ref={threadRef}
      data-thread-id={root.id}
      className={`border-l-4 ${borderClass} ${bgClass} transition-colors duration-300 pl-3 pr-2 py-2`}
      onClick={() => {
        scrollingFromRef.current = "sidebar";
        setActiveThreadId(root.id);
      }}
    >
      {/* Header — single line */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Pin number */}
        <span
          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${pinClass}`}
        >
          {isApplied ? "✓" : pinNumber}
        </span>

        {/* Author */}
        <span className="text-xs font-medium truncate">
          {getAuthorLabel(root, permissions.isAdmin)}
        </span>

        {/* Reviewer badge (unified view only) */}
        {unified && root.reviewerName && root.reviewerColorSeed != null && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 border"
            style={{
              borderColor: `hsl(${root.reviewerColorSeed} 70% 45%)`,
              color: `hsl(${root.reviewerColorSeed} 70% 35%)`,
              backgroundColor: `hsl(${root.reviewerColorSeed} 70% 95%)`,
            }}
            title={`Ревьюер: ${root.reviewerName}`}
          >
            {root.reviewerName}
          </span>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(root.createdAt)}
        </span>

        <span className="flex-1" />

        {/* Status badge (single) */}
        {isApplied ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-bg text-success font-medium shrink-0">
            Применена
          </span>
        ) : isResolved ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-bg text-success font-medium shrink-0">
            Решён
          </span>
        ) : isOrphan ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-bg text-danger font-medium shrink-0">
            Осиротел
          </span>
        ) : isBatchPending ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
            Черновик
          </span>
        ) : isSuggestion ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-info-bg text-info font-medium shrink-0">
            Правка
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-bg text-warning font-medium shrink-0">
            Открыт
          </span>
        )}
      </div>

      {/* Quoted text — no border, just prefix */}
      {quotedText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            scrollToAnchor();
          }}
          aria-label="Перейти к цитате"
          className="mt-1 block w-full text-left text-xs text-muted-foreground italic truncate hover:text-foreground transition-colors before:content-['»_'] before:text-muted-foreground/60"
        >
          {quotedText}
        </button>
      )}

      {/* Suggestion diff — flat, no inner rounded. Applied → collapsed details */}
      {isSuggestion && root.suggestionText && (
        <>
          {isApplied ? (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                Показать применённую правку
              </summary>
              <div className="mt-1.5 text-xs">
                <div className="bg-danger-bg/60 px-2 py-1 line-through text-danger/80">
                  {quotedText}
                </div>
                <div className="bg-success-bg/60 px-2 py-1 text-success/80">
                  {root.suggestionText}
                </div>
              </div>
            </details>
          ) : (
            <div className="mt-2 text-sm">
              <div className="bg-danger-bg/60 px-2 py-1 line-through text-danger/80">
                {quotedText}
              </div>
              <div className="bg-success-bg/60 px-2 py-1 text-success/80">
                {root.suggestionText}
              </div>
              {permissions.canApplySuggestion && canInteract && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplySuggestion(root);
                  }}
                  disabled={applyingId === root.id}
                  className="mt-1.5 px-3 py-1 text-xs font-medium bg-accent text-accent-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {applyingId === root.id ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Применение…
                    </>
                  ) : (
                    "Применить"
                  )}
                </button>
              )}

              {applyConflict && (
                <div className="mt-2 bg-warning-bg border-l-4 border-l-warning p-2">
                  <p className="text-xs font-medium text-warning mb-1.5">
                    Текст изменился, примените вручную
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-danger-bg/60 p-1.5 line-through">
                      {applyConflict.original}
                    </div>
                    <div className="bg-success-bg/60 p-1.5">
                      {applyConflict.suggestion}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setApplyConflict(null);
                    }}
                    className="mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Comment content */}
      <p className="mt-2 text-sm whitespace-pre-wrap">{root.content}</p>

      {/* Resolve / Reopen */}
      {canInteract && (
        <div className="mt-1 flex gap-3">
          {!isResolved && permissions.canResolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(root.id, true);
              }}
              disabled={resolvingId === root.id}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Решить
            </button>
          )}
          {isResolved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(root.id, false);
              }}
              disabled={resolvingId === root.id}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Переоткрыть
            </button>
          )}
        </div>
      )}

      {/* Replies — flat, no nested border */}
      {replies.length > 0 && (
        <div className="mt-2 pt-2 space-y-2 bg-muted/10 -mx-2 px-2 py-2 rounded-sm">
          {replies.map((reply) => (
            <div key={reply.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium">
                  {getAuthorLabel(reply, permissions.isAdmin)}
                </span>
                {reply.isAdminComment === 1 && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-info-bg text-info font-medium">
                    Редактор
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {permissions.canReply && canInteract && (
        <form
          onSubmit={handleReply}
          onClick={(e) => e.stopPropagation()}
          className="mx-3 mb-3 flex gap-2"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Ответить…"
            className="flex-1 px-2 py-1 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-3 py-1 text-xs font-medium bg-accent text-accent-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {submitting ? "…" : "Ответить"}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <p className="px-3 pb-2 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
