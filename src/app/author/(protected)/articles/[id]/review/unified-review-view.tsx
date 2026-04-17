"use client";

import { useMemo } from "react";
import {
  ReviewContextProvider,
  useReviewContext,
  type ReviewPermissions,
  type AssignmentStatus,
} from "@/components/review/review-context";
import { InlineReviewLayout } from "@/components/review/inline-review-layout";
import Link from "next/link";

const AUTHOR_PERMISSIONS: ReviewPermissions = {
  canComment: false,
  canSuggest: false,
  canApplySuggestion: true,
  canResolve: true,
  canReply: false,
  isAdmin: false,
};

interface Assignment {
  id: string;
  reviewerName: string;
  status: AssignmentStatus;
}

interface Props {
  articleId: string;
  articleTitle: string;
  assignments: Assignment[];
  currentUserId: string | null;
  backHref: string;
  children: React.ReactNode;
}

export function UnifiedReviewView({
  articleId,
  articleTitle,
  assignments,
  currentUserId,
  backHref,
  children,
}: Props) {
  // Для провайдера нам нужен assignmentId — используем первое pending/accepted,
  // либо любое, чтобы контекст не падал. Операции apply/resolve идут по id комментария,
  // так что конкретное значение assignmentId не критично.
  const primaryAssignmentId = assignments[0]?.id ?? "unified";
  const primaryStatus =
    (assignments[0]?.status ?? "pending") as AssignmentStatus;

  return (
    <ReviewContextProvider
      assignmentId={primaryAssignmentId}
      assignmentStatus={primaryStatus}
      permissions={AUTHOR_PERMISSIONS}
      currentUserId={currentUserId}
      unifiedArticleId={articleId}
    >
      <InlineReviewLayout
        articleTitle={articleTitle}
        sidebarHeader={
          <UnifiedSidebarHeader
            articleId={articleId}
            assignments={assignments}
          />
        }
        titleExtra={
          <Link
            href={backHref}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Назад к статье
          </Link>
        }
      >
        {children}
      </InlineReviewLayout>
    </ReviewContextProvider>
  );
}

function UnifiedSidebarHeader({
  articleId,
  assignments,
}: {
  articleId: string;
  assignments: Assignment[];
}) {
  const { reviewers, activeReviewerId, setActiveReviewerId, comments } =
    useReviewContext();

  const countsByReviewer = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of comments) {
      if (c.parentId !== null) continue;
      if (!c.reviewerId) continue;
      m.set(c.reviewerId, (m.get(c.reviewerId) ?? 0) + 1);
    }
    return m;
  }, [comments]);

  return (
    <div className="border-b border-border shrink-0">
      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Ревьюеры ({reviewers.length})
        </p>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveReviewerId(null)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              activeReviewerId === null
                ? "bg-accent text-accent-foreground border-accent"
                : "text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Все ({comments.filter((c) => c.parentId === null).length})
          </button>
          {reviewers.map((r) => {
            const active = activeReviewerId === r.id;
            const count = countsByReviewer.get(r.id) ?? 0;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() =>
                  setActiveReviewerId(active ? null : r.id)
                }
                className="px-2 py-0.5 text-xs rounded-full border transition-colors"
                style={{
                  borderColor: active
                    ? `hsl(${r.colorSeed} 70% 45%)`
                    : undefined,
                  backgroundColor: active
                    ? `hsl(${r.colorSeed} 70% 92%)`
                    : undefined,
                  color: active
                    ? `hsl(${r.colorSeed} 70% 30%)`
                    : undefined,
                }}
                title={r.name}
              >
                {r.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment shortcuts */}
      {assignments.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-1.5">
            Открыть отдельные сессии:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/author/articles/${articleId}/review/${a.id}`}
                className="px-2 py-0.5 text-xs rounded border border-border hover:border-accent/60 hover:text-foreground text-muted-foreground transition-colors"
              >
                {a.reviewerName}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
