"use client";

import { useState } from "react";
import { ReviewChecklist } from "@/components/review/review-checklist";
import { DiffView } from "@/components/review/diff-view";
import { BatchReviewBar } from "@/components/review/batch-review-bar";
import { BatchReviewModal } from "@/components/review/batch-review-modal";
import { SessionReviewThread } from "@/components/review/session-review-thread";
import { ReviewKeyboardHandler } from "@/components/review/review-keyboard-handler";
import {
  ReviewContextProvider,
  type ReviewPermissions,
  type AssignmentStatus,
} from "@/components/review/review-context";
import { InlineReviewLayout } from "@/components/review/inline-review-layout";
import { ReviewSidebar } from "@/components/review/review-sidebar";
import type { ReviewSessionStatus } from "@/types";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionParticipant {
  id: string;
  name: string;
  status: string;
}

interface Props {
  assignmentId: string;
  sessionId: string | null;
  sessionStatus: ReviewSessionStatus;
  sessionParticipants: SessionParticipant[];
  currentUserId: string | null;
  status: AssignmentStatus;
  articleTitle: string;
  versionsHref?: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

const PARTICIPANT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const REVIEWER_PERMISSIONS: ReviewPermissions = {
  canComment: true,
  canSuggest: true,
  canApplySuggestion: false,
  canResolve: true,
  canReply: true,
  isAdmin: false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewAssignmentView({
  assignmentId,
  sessionId,
  sessionStatus,
  sessionParticipants,
  currentUserId,
  status: initialStatus,
  articleTitle,
  versionsHref,
  children,
}: Props) {
  const [status, setStatus] = useState<AssignmentStatus>(initialStatus);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [contentTab, setContentTab] = useState<"article" | "diff">("article");

  const useSessionThread = !!sessionId;

  async function updateStatus(next: AssignmentStatus) {
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

  // Sidebar header: status + actions + participants + checklist
  const sidebarHeader = (
    <>
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
              onClick={() => setShowBatchModal(true)}
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

      {error && (
        <p className="px-4 py-2 text-danger text-xs">{error}</p>
      )}

      {/* Session participants */}
      {sessionParticipants.length > 0 && (
        <details className="border-b border-border shrink-0">
          <summary className="px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none list-none flex items-center justify-between">
            <span>Участники сессии ({sessionParticipants.length})</span>
            <span className="text-[10px] opacity-50">▼</span>
          </summary>
          <div className="px-4 pb-3 flex flex-col gap-1.5">
            {sessionParticipants.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-xs font-medium">{p.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${PARTICIPANT_STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {PARTICIPANT_STATUS_LABELS[p.status] ?? p.status}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Checklist */}
      <ReviewChecklist assignmentId={assignmentId} />
    </>
  );

  const sessionChat = useSessionThread ? (
    <SessionReviewThread
      sessionId={sessionId!}
      sessionStatus={sessionStatus}
      currentUserId={currentUserId}
      isAdmin={false}
    />
  ) : undefined;

  // Content tabs
  const contentTabs = (
    <div className="flex items-center gap-1 px-6 pt-4 pb-2 border-b border-border shrink-0">
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
      {versionsHref && (
        <Link
          href={versionsHref}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          История версий
        </Link>
      )}
    </div>
  );

  return (
    <ReviewContextProvider
      assignmentId={assignmentId}
      assignmentStatus={status}
      permissions={REVIEWER_PERMISSIONS}
      currentUserId={currentUserId}
    >
      {contentTab === "article" ? (
        <InlineReviewLayout
          articleTitle={articleTitle}
          sidebarHeader={sidebarHeader}
          sessionChat={sessionChat}
          contentTabs={contentTabs}
        >
          {children}
        </InlineReviewLayout>
      ) : (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-57px)] -mx-4 -mt-8">
          <div className="flex-1 min-h-0 flex flex-col">
            {contentTabs}
            <div className="flex-1 min-h-0 overflow-hidden">
              <DiffView assignmentId={assignmentId} />
            </div>
          </div>
          <aside className="w-full lg:w-[380px] min-h-[50vh] max-h-[50vh] lg:min-h-0 lg:max-h-none border-t lg:border-t-0 lg:border-l border-border bg-background shrink-0 overflow-hidden flex flex-col">
            <ReviewSidebar
              headerSlot={sidebarHeader}
              sessionChat={sessionChat}
            />
          </aside>
        </div>
      )}

      {/* Keyboard shortcuts */}
      <ReviewKeyboardHandler />

      {/* Batch review bar (sticky bottom) */}
      {status === "accepted" && (
        <BatchReviewBar onSubmitClick={() => setShowBatchModal(true)} />
      )}

      {/* Batch review modal */}
      {showBatchModal && (
        <BatchReviewModal
          assignmentId={assignmentId}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false);
            setStatus("completed");
          }}
        />
      )}
    </ReviewContextProvider>
  );
}
