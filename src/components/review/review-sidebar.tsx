"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewProgress } from "./review-progress";
import { ReviewThreadComponent } from "./review-thread";
import {
  useReviewContext,
  type FilterMode,
  type PendingAnchor,
} from "./review-context";

// ---------------------------------------------------------------------------
// Filter config
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: FilterMode; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "open", label: "Открытые" },
  { key: "resolved", label: "Решённые" },
  { key: "suggestions", label: "Предложения" },
  { key: "unanswered", label: "Без ответа" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  headerSlot?: React.ReactNode;
  sessionChat?: React.ReactNode;
}

type SidebarTab = "threads" | "chat";

export function ReviewSidebar({ headerSlot, sessionChat }: Props) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("threads");
  const {
    threads,
    comments,
    filterMode,
    setFilterMode,
    activeThreadId,
    permissions,
    assignmentId,
    assignmentStatus,
    refreshComments,
    pendingAnchor,
    setPendingAnchor,
  } = useReviewContext();

  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active thread into view
  useEffect(() => {
    if (!activeThreadId || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-thread-id="${CSS.escape(activeThreadId)}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeThreadId]);

  // Filter counts
  const totalCount = threads.length;
  const openCount = threads.filter((t) => t.root.resolvedAt === null).length;
  const resolvedCount = threads.filter(
    (t) => t.root.resolvedAt !== null,
  ).length;
  const suggestionCount = threads.filter(
    (t) => t.root.commentType === "suggestion",
  ).length;

  // Unanswered: root comments from reviewer (not admin) without admin replies
  const unansweredIds = new Set(
    threads
      .filter(
        (t) =>
          t.root.isAdminComment === 0 &&
          !t.replies.some((r) => r.isAdminComment === 1),
      )
      .map((t) => t.root.id),
  );
  const unansweredCount = unansweredIds.size;

  const filterCounts: Record<FilterMode, number> = {
    all: totalCount,
    open: openCount,
    resolved: resolvedCount,
    suggestions: suggestionCount,
    unanswered: unansweredCount,
  };

  // Apply filters
  const filteredThreads = threads.filter((t) => {
    switch (filterMode) {
      case "open":
        return t.root.resolvedAt === null;
      case "resolved":
        return t.root.resolvedAt !== null;
      case "suggestions":
        return t.root.commentType === "suggestion";
      case "unanswered":
        return unansweredIds.has(t.root.id);
      default:
        return true;
    }
  });

  // Progress
  const totalComments = comments.filter((c) => c.parentId === null).length;
  const resolvedComments = comments.filter(
    (c) => c.parentId === null && c.resolvedAt !== null,
  ).length;

  const canInteract =
    assignmentStatus === "pending" || assignmentStatus === "accepted";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Role-specific header */}
      {headerSlot}

      {/* Tab switcher: threads vs session chat */}
      {sessionChat && (
        <div className="px-3 py-2 border-b border-border flex gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("threads")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "threads"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Треды ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "chat"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Общий чат
          </button>
        </div>
      )}

      {/* Session chat panel */}
      {sessionChat && activeTab === "chat" && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {sessionChat}
        </div>
      )}

      {/* Threads panel */}
      {(!sessionChat || activeTab === "threads") && (
        <>
          {/* Progress bar */}
          {totalComments > 0 && (
            <div className="px-4 py-2 border-b border-border shrink-0">
              <ReviewProgress
                resolved={resolvedComments}
                total={totalComments}
              />
            </div>
          )}

          {/* Filter tabs */}
          {totalComments > 0 && (
            <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1 shrink-0">
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    filterMode === key
                      ? "bg-elevated shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label} ({filterCounts[key]})
                </button>
              ))}
            </div>
          )}

          {/* Thread list */}
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2"
          >
        {filteredThreads.length === 0 && (
          <div className="text-center py-8">
            <svg
              className="mx-auto mb-3 text-muted-foreground/30"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-xs text-muted-foreground">
              {totalComments === 0
                ? "Замечаний пока нет"
                : "Нет комментариев в этой категории"}
            </p>
          </div>
        )}

            {filteredThreads.map((thread) => (
              <ReviewThreadComponent
                key={thread.root.id}
                thread={thread}
                pinNumber={
                  // Pin number = 1-based index in unfiltered thread list
                  threads.findIndex((t) => t.root.id === thread.root.id) + 1
                }
              />
            ))}
          </div>

          {/* New comment form */}
          {(permissions.canComment || permissions.canReply) && canInteract && (
            <NewCommentForm
              assignmentId={assignmentId}
              pendingAnchor={pendingAnchor}
              setPendingAnchor={setPendingAnchor}
              permissions={permissions}
              refreshComments={refreshComments}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Comment Form
// ---------------------------------------------------------------------------

function NewCommentForm({
  assignmentId,
  pendingAnchor,
  setPendingAnchor,
  permissions,
  refreshComments,
}: {
  assignmentId: string;
  pendingAnchor: PendingAnchor | null;
  setPendingAnchor: (a: PendingAnchor | null) => void;
  permissions: { canSuggest: boolean; isAdmin: boolean };
  refreshComments: () => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [mode, setMode] = useState<"comment" | "suggestion">("comment");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When pendingAnchor is set from SelectionPopover/BlockCommentButton
  useEffect(() => {
    if (pendingAnchor) {
      setMode(pendingAnchor.mode);
      if (pendingAnchor.mode === "suggestion") {
        setSuggestionText("");
      }
      // Focus textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [pendingAnchor]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      if (mode === "suggestion" && !suggestionText.trim()) return;

      setSubmitting(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          content: content.trim(),
          commentType: mode,
        };

        if (pendingAnchor) {
          body.anchorType = pendingAnchor.anchorData.anchorType;
          body.anchorData = JSON.stringify(pendingAnchor.anchorData);
          if (pendingAnchor.quotedText) {
            body.quotedText = pendingAnchor.quotedText;
          }
        }

        if (mode === "suggestion") {
          body.suggestionText = suggestionText.trim();
        }

        const res = await fetch(
          `/api/assignments/${assignmentId}/review-comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );

        if (res.ok) {
          setContent("");
          setSuggestionText("");
          setMode("comment");
          setPendingAnchor(null);
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
    [
      content,
      mode,
      suggestionText,
      pendingAnchor,
      assignmentId,
      refreshComments,
      setPendingAnchor,
    ],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border px-3 py-3 flex flex-col gap-2 shrink-0"
    >
      {/* Pending anchor preview */}
      {pendingAnchor && pendingAnchor.quotedText && (
        <div className="flex items-start gap-2">
          <blockquote className="flex-1 border-l-4 border-accent/50 pl-3 text-xs text-muted-foreground italic line-clamp-2">
            {pendingAnchor.quotedText}
          </blockquote>
          <button
            type="button"
            onClick={() => setPendingAnchor(null)}
            className="text-muted-foreground hover:text-foreground text-xs shrink-0"
            aria-label="Убрать привязку"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode toggle */}
      {permissions.canSuggest && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("comment")}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === "comment"
                ? "bg-elevated shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Комментарий
          </button>
          <button
            type="button"
            onClick={() => setMode("suggestion")}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === "suggestion"
                ? "bg-elevated shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Правка
          </button>
        </div>
      )}

      {/* Comment textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder={
          mode === "suggestion"
            ? "Опишите предлагаемую правку…"
            : "Добавить комментарий…"
        }
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
      />

      {/* Suggestion replacement text */}
      {mode === "suggestion" && (
        <textarea
          value={suggestionText}
          onChange={(e) => setSuggestionText(e.target.value)}
          rows={2}
          placeholder="Предлагаемый текст замены…"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
        />
      )}

      {error && <p className="text-danger text-xs">{error}</p>}

      <button
        type="submit"
        disabled={
          submitting ||
          !content.trim() ||
          (mode === "suggestion" && !suggestionText.trim())
        }
        className="self-end px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Отправка…" : "Отправить"}
      </button>
    </form>
  );
}
