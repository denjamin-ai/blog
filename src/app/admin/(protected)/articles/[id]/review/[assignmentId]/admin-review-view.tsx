"use client";

import {
  ReviewContextProvider,
  type ReviewPermissions,
  type AssignmentStatus,
} from "@/components/review/review-context";
import { InlineReviewLayout } from "@/components/review/inline-review-layout";
import { VerdictBadge } from "@/components/review/verdict-badge";
import { ReviewChecklist } from "@/components/review/review-checklist";
import Link from "next/link";

const ADMIN_PERMISSIONS: ReviewPermissions = {
  canComment: true,
  canSuggest: false,
  canApplySuggestion: true,
  canResolve: true,
  canReply: true,
  isAdmin: true,
};

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

interface Props {
  assignmentId: string;
  assignmentStatus: AssignmentStatus;
  articleTitle: string;
  reviewerName: string;
  verdict: string | null;
  verdictNote: string | null;
  backHref?: string;
  children: React.ReactNode;
}

export function AdminReviewView({
  assignmentId,
  assignmentStatus,
  articleTitle,
  reviewerName,
  verdict,
  verdictNote,
  backHref,
  children,
}: Props) {
  const sidebarHeader = (
    <>
      {/* Reviewer info + status */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{reviewerName}</p>
            <p className="text-xs text-muted-foreground">Ревьюер</p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[assignmentStatus]}`}
          >
            {STATUS_LABELS[assignmentStatus]}
          </span>
        </div>

        {/* Verdict */}
        {verdict && (
          <div className="mt-2">
            <VerdictBadge verdict={verdict} />
            {verdictNote && (
              <p className="mt-1 text-xs text-muted-foreground italic">
                {verdictNote}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Checklist (read-only for admin) */}
      <ReviewChecklist assignmentId={assignmentId} />
    </>
  );

  return (
    <ReviewContextProvider
      assignmentId={assignmentId}
      assignmentStatus={assignmentStatus}
      permissions={ADMIN_PERMISSIONS}
      currentUserId={null}
    >
      <InlineReviewLayout
        articleTitle={articleTitle}
        sidebarHeader={sidebarHeader}
        titleExtra={
          backHref ? (
            <Link
              href={backHref}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Все ревью
            </Link>
          ) : undefined
        }
      >
        {children}
      </InlineReviewLayout>
    </ReviewContextProvider>
  );
}
