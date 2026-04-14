"use client";

import { useState } from "react";

interface Props {
  articleId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  articleId,
  parentId,
  onSuccess,
  onCancel,
}: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const body: { content: string; parentId?: string } = {
        content: content.trim(),
      };
      if (parentId) body.parentId = parentId;

      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let d: { error?: string } = {};
        try {
          d = await res.json();
        } catch {
          /* ignore */
        }
        setError(d.error ?? "Ошибка отправки");
        return;
      }

      setContent("");
      onSuccess();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label
        className="sr-only"
        htmlFor={parentId ? `reply-${parentId}` : "new-comment"}
      >
        {parentId ? "Текст ответа" : "Текст комментария"}
      </label>
      <textarea
        id={parentId ? `reply-${parentId}` : "new-comment"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Напишите комментарий…"
        rows={3}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
        disabled={submitting}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Отправка…" : "Отправить"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
