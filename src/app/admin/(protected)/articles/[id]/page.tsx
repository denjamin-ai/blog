"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReviewerPickerModal from "@/components/reviewer-picker-modal";

interface Assignment {
  id: string;
  reviewerId: string;
  reviewerName: string | null;
  reviewerUsername: string | null;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: number;
}

interface ChangelogEntry {
  id: string;
  entryDate: number;
  section: string | null;
  description: string;
}

const STATUS_LABELS: Record<Assignment["status"], string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_CLASSES: Record<Assignment["status"], string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

export default function AdminArticleModerationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(
    "draft",
  );
  const [scheduledAt, setScheduledAt] = useState<number | null>(null);
  const [scheduleInput, setScheduleInput] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [existingChangelog, setExistingChangelog] = useState<ChangelogEntry[]>(
    [],
  );
  const [newDate, setNewDate] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newDescription, setNewDescription] = useState("");

  interface PublicComment {
    id: string;
    authorName: string | null;
    content: string | null;
    parentId: string | null;
    createdAt: number;
    deletedAt: number | null;
  }
  const [publicComments, setPublicComments] = useState<PublicComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const loadPublicComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${id}/comments?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setPublicComments(data.comments ?? []);
      }
    } catch {
      // non-critical
    } finally {
      setCommentsLoaded(true);
    }
  }, [id]);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/assignments?articleId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch {
      // non-critical
    }
  }, [id]);

  const loadArticle = useCallback(async () => {
    const [articleRes, assignmentsRes, changelogRes] = await Promise.all([
      fetch(`/api/articles/${id}`),
      fetch(`/api/admin/assignments?articleId=${id}`),
      fetch(`/api/articles/${id}/changelog`),
    ]);

    if (!articleRes.ok) {
      const data = await articleRes.json().catch(() => ({}));
      setError(data.error || "Ошибка загрузки статьи");
      setLoadFailed(true);
      setLoaded(true);
      return;
    }

    const data = await articleRes.json();
    setTitle(data.title);
    setSlug(data.slug);
    setAuthorName(data.authorName ?? null);
    setStatus(data.status);
    setScheduledAt(data.scheduledAt ?? null);
    setUpdatedAt(data.updatedAt ?? 0);
    if (data.scheduledAt) {
      const dt = new Date(data.scheduledAt * 1000);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduleInput(local);
    }

    if (assignmentsRes.ok) {
      setAssignments(await assignmentsRes.json());
    }
    if (changelogRes.ok) {
      setExistingChangelog(await changelogRes.json());
    }

    setLoaded(true);
  }, [id]);

  useEffect(() => {
    loadArticle();
    loadPublicComments();
  }, [loadArticle, loadPublicComments]);

  // Сохранение заголовка/slug
  async function handleSaveMeta() {
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  // Изменение только статуса (admin не редактирует контент)
  async function handleStatusChange(
    newStatus?: "draft" | "published",
    saveMode?: string,
    extraPayload?: Record<string, unknown>,
  ) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(newStatus ? { status: newStatus } : {}),
          ...(saveMode ? { saveMode } : {}),
          ...(extraPayload ?? {}),
        }),
      });

      if (res.ok) {
        if (newStatus) setStatus(newStatus);
        if (saveMode === "schedule" && extraPayload?.scheduledAt) {
          setStatus("scheduled");
          setScheduledAt(extraPayload.scheduledAt as number);
          setShowSchedulePicker(false);
        }
        if (saveMode === "draft") {
          setStatus("draft");
          setScheduledAt(null);
          setScheduleInput("");
        }
        setError("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleScheduleConfirm() {
    if (!scheduleInput) return;
    const ts = Math.floor(new Date(scheduleInput).getTime() / 1000);
    await handleStatusChange(undefined, "schedule", { scheduledAt: ts });
  }

  const activeAssignment =
    assignments.find(
      (a) => a.status === "pending" || a.status === "accepted",
    ) ?? null;

  async function handleSendForReview(reviewer: {
    id: string;
    name: string;
    username: string;
  }) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveMode: "send_for_review",
          reviewerId: reviewer.id,
        }),
      });
      if (res.ok) {
        await loadAssignments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка отправки на ревью");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEntry() {
    if (!newDate || !newDescription.trim()) return;
    const entryDate = Math.floor(new Date(newDate).getTime() / 1000);
    const res = await fetch(`/api/articles/${id}/changelog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryDate,
        section: newSection.trim() || null,
        description: newDescription.trim(),
      }),
    });
    if (res.ok) {
      const entry = await res.json();
      setExistingChangelog((prev) => [...prev, entry]);
      setNewDate("");
      setNewSection("");
      setNewDescription("");
    }
  }

  async function handleDeleteEntry(entryId: string) {
    const res = await fetch(`/api/articles/${id}/changelog/${entryId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setExistingChangelog((prev) => prev.filter((e) => e.id !== entryId));
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Удалить комментарий?")) return;
    const res = await fetch(`/api/articles/${id}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPublicComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, deletedAt: Math.floor(Date.now() / 1000), content: null }
            : c,
        ),
      );
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить статью? Это действие необратимо.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/articles");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка удаления");
      }
    } catch {
      setError("Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  if (loadFailed) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={handleSaveMeta}
              disabled={saving}
              className="shrink-0 px-3 py-1 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? "..." : "Сохранить"}
            </button>
            {saved && (
              <span
                data-testid="saved-indicator"
                className="saved shrink-0 text-sm text-success"
              >
                Сохранено
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Автор: {authorName ?? <em>Администратор</em>} · Обновлено:{" "}
            {new Date(updatedAt * 1000).toLocaleDateString("ru-RU")}
          </p>
          {activeAssignment && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Ревью:{" "}
              <span className="font-medium text-foreground">
                {activeAssignment.reviewerName ?? "—"}
              </span>{" "}
              ·{" "}
              <span
                className={`text-xs font-medium ${STATUS_CLASSES[activeAssignment.status]}`}
              >
                {STATUS_LABELS[activeAssignment.status]}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/articles/${id}/history`}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            История
          </Link>
          {assignments.length > 0 && (
            <Link
              href={`/admin/articles/${id}/review`}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Ревью ({assignments.length})
            </Link>
          )}
          {status === "published" && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-accent hover:underline"
            >
              Просмотр &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Статус */}
      <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Статус:</span>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              status === "published"
                ? "bg-success-bg text-success"
                : status === "scheduled"
                  ? "bg-info-bg text-info"
                  : "bg-warning-bg text-warning"
            }`}
          >
            {status === "published"
              ? "Опубликовано"
              : status === "scheduled"
                ? "Запланировано"
                : "Черновик"}
          </span>
          {status === "scheduled" && scheduledAt && (
            <span className="text-xs text-muted-foreground">
              на {new Date(scheduledAt * 1000).toLocaleString("ru-RU")}
            </span>
          )}
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3 flex-wrap">
          {status === "published" ? (
            <button
              onClick={() => handleStatusChange("draft")}
              disabled={saving}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Снять с публикации
            </button>
          ) : status === "scheduled" ? (
            <>
              <button
                onClick={() => handleStatusChange("published")}
                disabled={saving}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Опубликовать сейчас
              </button>
              <button
                onClick={() => handleStatusChange(undefined, "draft")}
                disabled={saving}
                className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Отменить расписание
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleStatusChange("published")}
                disabled={saving}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Опубликовать
              </button>
              <button
                onClick={() => setShowSchedulePicker((v) => !v)}
                disabled={saving}
                className="px-4 py-2 border border-info text-info rounded-lg text-sm font-medium hover:bg-info-bg transition-colors disabled:opacity-50"
              >
                Запланировать
              </button>
            </>
          )}

          <button
            onClick={() => setShowReviewModal(true)}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            На ревью
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
          >
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>

        {showSchedulePicker && (
          <div className="flex items-end gap-3 px-3 py-3 rounded-lg border border-border bg-background">
            <div>
              <label className="block text-xs font-medium mb-1">
                Дата и время публикации
              </label>
              <input
                type="datetime-local"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
            <button
              onClick={handleScheduleConfirm}
              disabled={saving || !scheduleInput}
              className="px-4 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "..." : "Подтвердить"}
            </button>
            <button
              onClick={() => setShowSchedulePicker(false)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {/* Назначения на ревью */}
      {assignments.length > 0 && (
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Назначения на ревью</h2>
            <Link
              href={`/admin/articles/${id}/review`}
              className="text-sm text-accent hover:underline"
            >
              Подробнее →
            </Link>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Ревьер</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Назначено</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-border hover:bg-elevated transition-colors even:bg-muted/20"
                  >
                    <td className="px-3 py-2 text-sm">
                      {a.reviewerName ?? "—"}
                      {a.reviewerUsername && (
                        <span className="text-muted-foreground ml-1.5">
                          {a.reviewerUsername}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[a.status]}`}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {new Date(a.createdAt * 1000).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Журнал изменений */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-semibold mb-4">Журнал изменений</h2>

        {existingChangelog.length > 0 && (
          <div className="space-y-2 mb-4">
            {existingChangelog.map((entry) => {
              const date = new Date(entry.entryDate * 1000).toLocaleDateString(
                "ru-RU",
                { year: "numeric", month: "long", day: "numeric" },
              );
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <span className="text-muted-foreground shrink-0">{date}</span>
                  {entry.section && (
                    <span className="font-medium">{entry.section}:</span>
                  )}
                  <span className="flex-1">{entry.description}</span>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-xs text-danger hover:opacity-70 shrink-0 transition-opacity"
                  >
                    Удалить
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Дата</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">
                Раздел (опционально)
              </label>
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Введение"
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Описание</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Что изменилось?"
              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={handleAddEntry}
            disabled={!newDate || !newDescription.trim()}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            + Добавить запись
          </button>
        </div>
      </div>

      {/* Публичные комментарии */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-semibold mb-4">
          Публичные комментарии
          {publicComments.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({publicComments.filter((c) => !c.deletedAt).length} активных)
            </span>
          )}
        </h2>

        {!commentsLoaded ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : publicComments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Комментариев пока нет.
          </p>
        ) : (
          <div className="space-y-2">
            {publicComments.map((c) => (
              <div
                key={c.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${
                  c.deletedAt
                    ? "border-border bg-muted/20 opacity-50"
                    : "border-border"
                } ${c.parentId ? "ml-6" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {c.authorName ?? "Аноним"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.createdAt * 1000).toLocaleString("ru-RU")}
                    </span>
                    {c.parentId && (
                      <span className="text-xs text-muted-foreground">
                        (ответ)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.deletedAt ? "[удалено]" : (c.content ?? "")}
                  </p>
                </div>
                {!c.deletedAt && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-xs text-danger hover:opacity-70 shrink-0 transition-opacity"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ReviewerPickerModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSelect={(reviewer) => {
          setShowReviewModal(false);
          handleSendForReview(reviewer);
        }}
      />
    </div>
  );
}
