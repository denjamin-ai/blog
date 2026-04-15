"use client";

import { useState } from "react";
import { VersionWarning } from "./version-warning";
import { DeletedComment } from "./deleted-comment";
import { CommentForm } from "./comment-form";

export interface CommentData {
  id: string;
  articleId: string;
  articleVersionId: string;
  authorId: string;
  authorName: string | null;
  content: string | null;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  isStale: boolean;
  rating: number;
  userVote: 1 | -1 | null;
}

export interface CommentNode extends CommentData {
  replies: CommentNode[];
}

interface Props {
  node: CommentNode;
  articleId: string;
  currentVersionId: string | null;
  currentUserId: string | null;
  isReader: boolean;
  isCommentingBlocked?: boolean;
  onRefresh: () => void;
  depth?: number;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentVoting({
  commentId,
  initialRating,
  initialUserVote,
  isOwnComment,
  isBlocked,
}: {
  commentId: string;
  initialRating: number;
  initialUserVote: 1 | -1 | null;
  isOwnComment: boolean;
  isBlocked: boolean;
}) {
  const [rating, setRating] = useState(initialRating);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote);
  const [loading, setLoading] = useState(false);

  if (isOwnComment || isBlocked) return null;

  async function vote(value: 1 | -1) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          userVote: 1 | -1 | null;
          rating: number;
        };
        setRating(data.rating);
        setUserVote(data.userVote);
      }
    } catch {
      // сеть недоступна
    } finally {
      setLoading(false);
    }
  }

  const btnBase =
    "flex items-center justify-center w-5 h-5 rounded transition-colors";
  const activeUp = "text-success";
  const activeDown = "text-danger";
  const idle =
    "text-muted-foreground hover:text-foreground disabled:opacity-40";

  return (
    <span className="inline-flex items-center gap-0.5 ml-2">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`${btnBase} ${userVote === 1 ? activeUp : idle}`}
        title="Нравится"
        aria-label="Нравится"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <span className="text-xs tabular-nums text-muted-foreground w-4 text-center">
        {rating > 0 ? `+${rating}` : rating === 0 ? "0" : rating}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`${btnBase} ${userVote === -1 ? activeDown : idle}`}
        title="Не нравится"
        aria-label="Не нравится"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </span>
  );
}

export function CommentItem({
  node,
  articleId,
  currentVersionId,
  currentUserId,
  isReader,
  isCommentingBlocked = false,
  onRefresh,
  depth = 0,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const now = Math.floor(Date.now() / 1000);
  const withinEditWindow = now - node.createdAt <= 900;
  const isAuthor = currentUserId === node.authorId;

  const showReplyButton = depth === 0 && isReader && !node.deletedAt;
  const showEditButton = isAuthor && !node.deletedAt && withinEditWindow;
  const showDeleteButton = isAuthor && !node.deletedAt;

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setEditError(null);
    setEditSaving(true);
    try {
      const res = await fetch(
        `/api/articles/${articleId}/comments/${node.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        },
      );
      if (!res.ok) {
        let d: { error?: string } = {};
        try {
          d = await res.json();
        } catch {
          /* ignore */
        }
        setEditError(d.error ?? "Ошибка сохранения");
        return;
      }
      setEditing(false);
      onRefresh();
    } catch {
      setEditError("Ошибка сети");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await fetch(`/api/articles/${articleId}/comments/${node.id}`, {
        method: "DELETE",
      });
      onRefresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {node.deletedAt ? (
        <DeletedComment />
      ) : (
        <>
          {node.isStale && (
            <VersionWarning
              variant="comment"
              commentVersionId={node.articleVersionId}
            />
          )}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold">
              {node.authorName ?? "Аноним"}
            </span>
            <time className="text-xs text-muted-foreground">
              {formatDate(node.createdAt)}
            </time>
            {node.updatedAt !== node.createdAt && (
              <span className="text-xs text-muted-foreground">(изменено)</span>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
                disabled={editSaving}
              />
              {editError && <p className="text-xs text-danger">{editError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving || !editContent.trim()}
                  className="px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {editSaving ? "Сохранение…" : "Сохранить"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditContent(node.content ?? "");
                    setEditError(null);
                  }}
                  className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{node.content}</p>
          )}

          {!editing && (
            <div className="flex items-center gap-3 mt-1">
              {showReplyButton && (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ответить
                </button>
              )}
              {showEditButton && (
                <button
                  onClick={() => {
                    setEditContent(node.content ?? "");
                    setEditing(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Редактировать
                </button>
              )}
              {showDeleteButton && (
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="text-xs text-muted-foreground hover:text-danger transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? "Удаление…" : "Удалить"}
                </button>
              )}
              <CommentVoting
                commentId={node.id}
                initialRating={node.rating}
                initialUserVote={node.userVote}
                isOwnComment={isAuthor}
                isBlocked={isCommentingBlocked}
              />
            </div>
          )}
        </>
      )}

      {showReplyForm && (
        <div className="mt-2 flex flex-col gap-2">
          {node.isStale && (
            <VersionWarning
              variant="reply"
              commentVersionId={node.articleVersionId}
              currentVersionId={currentVersionId}
            />
          )}
          <CommentForm
            articleId={articleId}
            parentId={node.id}
            onSuccess={() => {
              setShowReplyForm(false);
              onRefresh();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {node.replies.length > 0 && (
        <div className="ml-2 pl-2 sm:ml-4 sm:pl-3 border-l-2 border-border flex flex-col gap-4 mt-2">
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              articleId={articleId}
              currentVersionId={currentVersionId}
              currentUserId={currentUserId}
              isReader={isReader}
              isCommentingBlocked={isCommentingBlocked}
              onRefresh={onRefresh}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
