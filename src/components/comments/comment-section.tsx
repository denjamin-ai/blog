"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CommentItem,
  type CommentData,
  type CommentNode,
} from "./comment-item";
import { CommentForm } from "./comment-form";

interface Props {
  articleId: string;
  currentVersionId: string | null;
}

type AuthState =
  | { status: "loading" }
  | { status: "reader"; userId: string }
  | { status: "unauthenticated" }
  | { status: "other" };

function buildTree(flat: CommentData[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  const asc = (a: CommentNode, b: CommentNode) => a.createdAt - b.createdAt;
  roots.sort(asc);
  roots.forEach((r) => r.replies.sort(asc));

  return roots;
}

export function CommentSection({ articleId, currentVersionId }: Props) {
  const allCommentsRef = useRef<CommentData[]>([]);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const versionParam = currentVersionId
        ? `&versionId=${currentVersionId}`
        : "";
      const url = `/api/articles/${articleId}/comments?page=${pageNum}&limit=20${versionParam}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: {
        comments: CommentData[];
        total: number;
        page: number;
        totalPages: number;
      } = await res.json();

      setTotalPages(data.totalPages);
      setPage(data.page);

      if (append) {
        allCommentsRef.current = [...allCommentsRef.current, ...data.comments];
        setComments(buildTree(allCommentsRef.current));
      } else {
        allCommentsRef.current = data.comments;
        setComments(buildTree(data.comments));
      }
    },
    [articleId, currentVersionId],
  );

  const loadComments = useCallback(async () => {
    try {
      await fetchPage(1, false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((d: { userId: string | null; userRole: string | null }) => {
        if (!d.userId) {
          setAuthState({ status: "unauthenticated" });
        } else if (d.userRole === "reader") {
          setAuthState({ status: "reader", userId: d.userId });
        } else {
          setAuthState({ status: "other" });
        }
      })
      .catch(() => setAuthState({ status: "unauthenticated" }));
  }, []);

  const currentUserId = authState.status === "reader" ? authState.userId : null;
  const isReader = authState.status === "reader";

  function renderForm() {
    if (authState.status === "loading" || authState.status === "other")
      return null;
    if (authState.status === "unauthenticated") {
      return (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-accent hover:underline">
            Войдите
          </Link>
          , чтобы оставить комментарий
        </p>
      );
    }
    return <CommentForm articleId={articleId} onSuccess={loadComments} />;
  }

  const hasMore = page < totalPages;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-bold">Комментарии</h2>

      {renderForm()}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Комментариев пока нет. Будьте первым!
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {comments.map((node) => (
              <CommentItem
                key={node.id}
                node={node}
                articleId={articleId}
                currentVersionId={currentVersionId}
                currentUserId={currentUserId}
                isReader={isReader}
                onRefresh={loadComments}
                depth={0}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="self-start text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Загрузка…" : "Загрузить ещё"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
