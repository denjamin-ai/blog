"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationPayload = {
  articleId?: string;
  assignmentId?: string;
  commentId?: string;
};

type Notification = {
  id: string;
  type: string;
  payload: NotificationPayload;
  isRead: number;
  createdAt: number;
};

const LABELS: Record<string, string> = {
  assignment_accepted: "Ревьер принял назначение",
  assignment_declined: "Ревьер отклонил назначение",
  review_completed: "Ревью завершено",
  review_comment_reply: "Новый ответ в ревью",
  article_updated: "Статья обновлена",
  article_hidden: "Ваши публикации скрыты администратором",
};

function getDeepLink(n: Notification): string {
  const { articleId } = n.payload;
  if (n.type === "article_hidden") return "/author/articles";
  return articleId ? `/author/articles/${articleId}/review` : "/author";
}

function formatTime(createdAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - createdAt;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

export default function AuthorNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load(pageNum: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=30`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setItems(data.notifications);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? pageNum);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  async function handleClick(n: Notification) {
    try {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    } catch {
      // silent
    }
    router.push(getDeepLink(n));
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      await load(page);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }

  const unread = items.filter((n) => n.isRead === 0);
  const read = items.filter((n) => n.isRead === 1);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Уведомления</h1>
        {unread.length > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Отметить все прочитанными
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет уведомлений</p>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {unread.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left bg-accent/20 hover:bg-accent/40 transition-colors"
            >
              <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {LABELS[n.type] ?? n.type}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(n.createdAt)}
              </span>
            </button>
          ))}

          {unread.length > 0 && read.length > 0 && (
            <div className="px-4 py-2 bg-muted/30">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Прочитанные
              </span>
            </div>
          )}

          {read.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="mt-1.5 w-2 h-2 rounded-full bg-transparent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {LABELS[n.type] ?? n.type}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(n.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            ← Назад
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages || loading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
