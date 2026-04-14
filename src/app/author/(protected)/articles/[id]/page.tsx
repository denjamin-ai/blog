"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReviewerPickerModal from "@/components/reviewer-picker-modal";
import { DiffPreviewModal } from "@/components/review/diff-preview-modal";
import { useLocalStorageDraft } from "@/hooks/useLocalStorageDraft";

interface Assignment {
  id: string;
  reviewerId: string;
  reviewerName: string | null;
  reviewerUsername: string | null;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: number;
  articleVersionId: string;
  versionCreatedAt: number | null;
  verdict: string | null;
  verdictNote: string | null;
  totalComments: number;
  resolvedCount: number;
}

const STATUS_LABELS: Record<Assignment["status"], string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_CLASSES: Record<Assignment["status"], string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function AuthorEditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(
    "draft",
  );
  const [scheduledAt, setScheduledAt] = useState<number | null>(null);
  const [scheduleInput, setScheduleInput] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifying, setNotifying] = useState(false);
  const [publishBlocked, setPublishBlocked] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDiffPreview, setShowDiffPreview] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/author/assignments?articleId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch {
      // non-critical
    }
  }, [id]);

  const loadArticle = useCallback(async () => {
    const [articleRes, assignmentsRes] = await Promise.all([
      fetch(`/api/articles/${id}`),
      fetch(`/api/author/assignments?articleId=${id}`),
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
    setExcerpt(data.excerpt);
    try {
      setTagsInput(JSON.parse(data.tags || "[]").join(", "));
    } catch {
      setTagsInput("");
    }
    setContent(data.content);
    setStatus(data.status);
    setUpdatedAt(data.updatedAt);
    setCoverImageUrl(data.coverImageUrl ?? null);
    setDifficulty(data.difficulty ?? "");
    setScheduledAt(data.scheduledAt ?? null);
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

    setLoaded(true);
  }, [id]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  // Ref для доступа к актуальным значениям формы из интервала автосохранения
  const formDataRef = useRef({ title, content, excerpt });
  useEffect(() => {
    formDataRef.current = { title, content, excerpt };
  }, [title, content, excerpt]);

  const {
    saveStatus,
    quotaExceeded,
    showRestoreDialog,
    restoreDraft,
    discardDraft,
    clearSavedDraft,
  } = useLocalStorageDraft({
    articleId: id,
    serverUpdatedAt: updatedAt,
    getFormData: () => formDataRef.current,
    onRestore: ({ title: t, content: c, excerpt: e }) => {
      setTitle(t);
      setContent(c);
      setExcerpt(e);
    },
  });

  async function handleSave(
    newStatus?: "draft" | "published",
    saveMode?: string,
    extraPayload?: Record<string, unknown>,
  ) {
    setError("");
    setSaving(true);
    setPublishBlocked(false);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          tags,
          content,
          status: newStatus || status,
          changeNote: changeNote || undefined,
          coverImageUrl: coverImageUrl,
          difficulty: difficulty || null,
          ...(saveMode ? { saveMode } : {}),
          ...(extraPayload ?? {}),
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setChangeNote("");
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
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
        clearSavedDraft();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.error?.includes("заблокирована")) {
          setPublishBlocked(true);
        }
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
    await handleSave(undefined, "schedule", { scheduledAt: ts });
  }

  const activeAssignment =
    assignments.find(
      (a) => a.status === "pending" || a.status === "accepted",
    ) ?? null;

  // Version staleness: article updated after the reviewer's version snapshot
  const isStale =
    activeAssignment &&
    activeAssignment.versionCreatedAt !== null &&
    updatedAt > activeAssignment.versionCreatedAt;

  async function handleNotifyReviewer() {
    setError("");
    setNotifying(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          tags,
          content,
          status,
          changeNote: changeNote || undefined,
          coverImageUrl: coverImageUrl,
          difficulty: difficulty || null,
          saveMode: "notify_reviewer",
        }),
      });
      if (res.ok) {
        setChangeNote("");
        await loadAssignments();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка отправки уведомления");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setNotifying(false);
    }
  }

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

  async function handleDelete() {
    if (!confirm("Удалить статью? Это действие необратимо.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/author/articles");
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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setCoverImageUrl(url);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка сети");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  async function handlePreview() {
    setSaving(true);
    setError("");
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          tags,
          content,
          status,
          coverImageUrl,
          difficulty: difficulty || null,
        }),
      });
    } catch {
      // non-critical for preview
    } finally {
      setSaving(false);
      setShowPreview(true);
    }
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  if (loadFailed) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      {/* Диалог восстановления черновика */}
      {showRestoreDialog && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm flex items-center justify-between gap-4">
          <span className="text-yellow-800 dark:text-yellow-400">
            Найдены несохранённые изменения. Восстановить?
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={restoreDraft}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Восстановить
            </button>
            <button
              onClick={discardDraft}
              className="px-3 py-1 border border-yellow-400 text-yellow-700 dark:text-yellow-400 rounded text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {quotaExceeded && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
          localStorage переполнен — автосохранение отключено.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Редактирование</h1>
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground">
                Сохранение...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Сохранено
              </span>
            )}
          </div>
          {activeAssignment ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Ревью:{" "}
              <span className="font-medium text-foreground">
                {activeAssignment.reviewerName ?? "—"}
              </span>{" "}
              ·{" "}
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_CLASSES[activeAssignment.status]}`}
              >
                {STATUS_LABELS[activeAssignment.status]}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              Без активного ревью
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/author/articles/${id}/history`}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            История
          </Link>
          {assignments.length > 0 && (
            <Link
              href={`/author/articles/${id}/review`}
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

      {/* Version awareness block (US-A23) */}
      {activeAssignment && activeAssignment.versionCreatedAt && (
        <div className="mb-4 space-y-2">
          <div className="px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm flex items-center gap-2">
            <span className="text-muted-foreground">
              Ревьюер видит версию от
            </span>
            <span className="font-medium">
              {new Date(
                activeAssignment.versionCreatedAt * 1000,
              ).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {isStale && (
            <div className="px-4 py-2.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
              Статья изменена после назначения ревью. Нажмите «Уведомить
              ревьюера», чтобы он увидел изменения.
            </div>
          )}
        </div>
      )}

      {/* Progress summary (US-A25) */}
      {activeAssignment && activeAssignment.totalComments > 0 && (
        <Link
          href={`/author/articles/${id}/review`}
          className="block mb-4 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          {activeAssignment.resolvedCount === activeAssignment.totalComments ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Все замечания решены ✓
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Замечаний:{" "}
              <span className="font-medium text-foreground">
                {activeAssignment.totalComments}
              </span>{" "}
              · Решено:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                {activeAssignment.resolvedCount}
              </span>{" "}
              · Открыто:{" "}
              <span className="font-medium text-red-600 dark:text-red-400">
                {activeAssignment.totalComments -
                  activeAssignment.resolvedCount}
              </span>
            </p>
          )}
        </Link>
      )}

      {publishBlocked && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
          Публикация заблокирована администратором. Вы можете продолжать работу
          с черновиками.
        </div>
      )}

      <div className="space-y-4 max-w-4xl">
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Теги (через запятую)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Обложка</label>
          {coverImageUrl && (
            <div className="relative mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Обложка"
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setCoverImageUrl(null)}
                className="mt-1 text-xs text-red-500 hover:opacity-70 transition-opacity"
              >
                Удалить обложку
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverUpload}
            disabled={uploadingCover}
            className="text-sm text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:border file:border-border file:rounded-lg file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer disabled:opacity-50"
          />
          {uploadingCover && (
            <p className="text-xs text-muted-foreground mt-1">Загрузка...</p>
          )}
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Уровень сложности
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            <option value="">Не указан</option>
            <option value="simple">Простой</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Контент (MDX)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Заметка об изменении (опционально)
          </label>
          <input
            type="text"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Что изменено?"
          />
        </div>

        {error && !publishBlocked && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* Бейдж запланированной публикации */}
        {status === "scheduled" && scheduledAt && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
            <span>
              Запланировано на{" "}
              <strong>
                {new Date(scheduledAt * 1000).toLocaleString("ru-RU")}
              </strong>
            </span>
          </div>
        )}

        {/* Inline DateTimePicker для планирования */}
        {showSchedulePicker && (
          <div className="flex items-end gap-3 px-3 py-3 rounded-lg border border-border bg-muted/30">
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
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>

          {status === "published" ? (
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Снять с публикации
            </button>
          ) : status === "scheduled" ? (
            <>
              <button
                onClick={() => handleSave("published")}
                disabled={saving || publishBlocked}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Опубликовать сейчас
              </button>
              <button
                onClick={() => handleSave(undefined, "draft")}
                disabled={saving}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Отменить расписание
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave("published")}
                disabled={saving || publishBlocked}
                title={
                  publishBlocked
                    ? "Публикация заблокирована администратором"
                    : undefined
                }
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Опубликовать
              </button>
              <button
                onClick={() => setShowSchedulePicker((v) => !v)}
                disabled={saving || publishBlocked}
                className="px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
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

          {activeAssignment && (
            <button
              onClick={() => setShowDiffPreview(true)}
              disabled={saving || notifying}
              title="Показать изменения и уведомить ревьюера"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isStale
                  ? "bg-accent text-accent-foreground hover:opacity-90"
                  : "border border-accent text-accent hover:bg-accent/10"
              }`}
            >
              {notifying ? "Отправка..." : "Уведомить ревьюера"}
            </button>
          )}

          <button
            onClick={handlePreview}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Предпросмотр
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
          >
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>

        {showPreview && (
          <dialog
            open
            className="fixed inset-0 w-full h-full p-0 m-0 max-w-none max-h-none border-0 z-50 bg-black/50"
          >
            <div className="relative w-full h-full flex flex-col bg-background">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 z-10 px-3 py-1.5 text-sm border border-border rounded-lg bg-background hover:bg-muted transition-colors"
              >
                ✕ Закрыть
              </button>
              <iframe
                src={`/author/articles/${id}/preview`}
                className="flex-1 w-full border-0"
                title="Предпросмотр статьи"
              />
            </div>
          </dialog>
        )}

        {assignments.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Назначения на ревью</h2>
              <Link
                href={`/author/articles/${id}/review`}
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
                      className="border-t border-border hover:bg-muted/30 transition-colors"
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
                        {new Date(a.createdAt * 1000).toLocaleDateString(
                          "ru-RU",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {showDiffPreview && activeAssignment && (
        <DiffPreviewModal
          assignmentId={activeAssignment.id}
          confirming={notifying}
          onConfirm={() => {
            setShowDiffPreview(false);
            handleNotifyReviewer();
          }}
          onClose={() => setShowDiffPreview(false)}
        />
      )}
    </div>
  );
}
