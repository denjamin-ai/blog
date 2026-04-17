"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AnchorData } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewComment {
  id: string;
  sessionId: string | null;
  assignmentId: string | null;
  authorId: string | null;
  authorName: string | null;
  isAdminComment: number;
  content: string;
  quotedText: string | null;
  quotedAnchor: string | null;
  anchorType: string | null;
  anchorData: string | null;
  commentType: string | null;
  suggestionText: string | null;
  batchId: string | null;
  appliedAt: number | null;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
  resolvedBy: string | null;
  // Опционально — только для unified view (несколько ревьюеров на одной странице)
  reviewerId?: string | null;
  reviewerName?: string | null;
  reviewerColorSeed?: number | null;
}

export interface ReviewerInfo {
  id: string;
  name: string;
  colorSeed: number;
  assignmentId: string;
  status: string;
}

export interface ReviewThread {
  root: ReviewComment;
  replies: ReviewComment[];
}

export type FilterMode =
  | "all"
  | "open"
  | "resolved"
  | "suggestions"
  | "unanswered";

export type AssignmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed";

export interface ReviewPermissions {
  canComment: boolean;
  canSuggest: boolean;
  canApplySuggestion: boolean;
  canResolve: boolean;
  canReply: boolean;
  isAdmin: boolean;
}

export interface PendingAnchor {
  anchorData: AnchorData;
  quotedText: string;
  mode: "comment" | "suggestion";
}

export interface ReviewContextValue {
  comments: ReviewComment[];
  threads: ReviewThread[];
  refreshComments: () => Promise<void>;
  loading: boolean;
  permissions: ReviewPermissions;
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  articleRef: React.RefObject<HTMLElement | null>;
  assignmentId: string;
  assignmentStatus: AssignmentStatus;
  orphanIds: Set<string>;
  setOrphanIds: (ids: Set<string>) => void;
  pendingAnchor: PendingAnchor | null;
  setPendingAnchor: (anchor: PendingAnchor | null) => void;
  pendingCount: number;
  currentUserId: string | null;
  scrollingFromRef: React.RefObject<string | null>;
  // --- Unified mode (multi-reviewer view for author) ---
  unified: boolean;
  reviewers: ReviewerInfo[];
  activeReviewerId: string | null;
  setActiveReviewerId: (id: string | null) => void;
  // --- Toast (ephemeral notifications) ---
  toast: { message: string; tone: "success" | "error" } | null;
  showToast: (message: string, tone?: "success" | "error") => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function useReviewContext() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error("useReviewContext must be inside ReviewContextProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ProviderProps {
  assignmentId: string;
  assignmentStatus: AssignmentStatus;
  permissions: ReviewPermissions;
  currentUserId: string | null;
  // Если задан — используется unified endpoint (все ревьюеры сразу).
  unifiedArticleId?: string;
  children: React.ReactNode;
}

export function ReviewContextProvider({
  assignmentId,
  assignmentStatus,
  permissions,
  currentUserId,
  unifiedArticleId,
  children,
}: ProviderProps) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerInfo[]>([]);
  const [activeReviewerId, setActiveReviewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [orphanIds, setOrphanIds] = useState<Set<string>>(new Set());
  const [pendingAnchor, setPendingAnchor] = useState<PendingAnchor | null>(
    null,
  );
  const articleRef = useRef<HTMLElement | null>(null);
  const scrollingFromRef = useRef<string | null>(null);
  const unified = !!unifiedArticleId;
  const [toast, setToast] = useState<
    { message: string; tone: "success" | "error" } | null
  >(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message, tone });
      toastTimerRef.current = setTimeout(() => setToast(null), 2500);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const refreshComments = useCallback(async () => {
    try {
      if (unifiedArticleId) {
        const res = await fetch(
          `/api/author/articles/${unifiedArticleId}/review-comments`,
        );
        if (res.ok) {
          const data: { comments: ReviewComment[]; reviewers: ReviewerInfo[] } =
            await res.json();
          setComments(
            [...(data.comments ?? [])].sort((a, b) => a.createdAt - b.createdAt),
          );
          setReviewers(data.reviewers ?? []);
        }
      } else {
        const res = await fetch(
          `/api/assignments/${assignmentId}/review-comments`,
        );
        if (res.ok) {
          const data: ReviewComment[] = await res.json();
          setComments([...data].sort((a, b) => a.createdAt - b.createdAt));
        }
      }
    } catch {
      // ignore network errors silently
    } finally {
      setLoading(false);
    }
  }, [assignmentId, unifiedArticleId]);

  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  // Build threads from flat comment list (reviewer filter только для unified)
  const threads = useMemo<ReviewThread[]>(() => {
    const visible =
      unified && activeReviewerId
        ? comments.filter(
            (c) =>
              c.reviewerId === activeReviewerId ||
              // reply видим, если его родитель принадлежит выбранному ревьюеру
              (c.parentId !== null &&
                comments.find((p) => p.id === c.parentId)?.reviewerId ===
                  activeReviewerId),
          )
        : comments;
    const roots = visible.filter((c) => c.parentId === null);
    return roots.map((root) => ({
      root,
      replies: visible
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));
  }, [comments, unified, activeReviewerId]);

  // Count pending (batch draft) root comments
  const pendingCount = useMemo(
    () => comments.filter((c) => c.parentId === null && c.batchId !== null).length,
    [comments],
  );

  const value = useMemo<ReviewContextValue>(
    () => ({
      comments,
      threads,
      refreshComments,
      loading,
      permissions,
      activeThreadId,
      setActiveThreadId,
      filterMode,
      setFilterMode,
      articleRef,
      assignmentId,
      assignmentStatus,
      orphanIds,
      setOrphanIds,
      pendingAnchor,
      setPendingAnchor,
      pendingCount,
      currentUserId,
      scrollingFromRef,
      unified,
      reviewers,
      activeReviewerId,
      setActiveReviewerId,
      toast,
      showToast,
    }),
    [
      comments,
      threads,
      refreshComments,
      loading,
      permissions,
      activeThreadId,
      filterMode,
      assignmentId,
      assignmentStatus,
      orphanIds,
      pendingAnchor,
      pendingCount,
      currentUserId,
      unified,
      reviewers,
      activeReviewerId,
      toast,
      showToast,
    ],
  );

  return (
    <ReviewContext.Provider value={value}>
      {children}
      <ToastLayer />
    </ReviewContext.Provider>
  );
}

function ToastLayer() {
  const ctx = useContext(ReviewContext);
  if (!ctx || !ctx.toast) return null;
  const tone = ctx.toast.tone;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div
        className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium border ${
          tone === "success"
            ? "bg-success-bg border-success/40 text-success"
            : "bg-danger-bg border-danger/40 text-danger"
        }`}
      >
        {ctx.toast.message}
      </div>
    </div>
  );
}
