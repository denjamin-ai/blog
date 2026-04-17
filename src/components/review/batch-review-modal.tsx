"use client";

import { useEffect, useState } from "react";
import { useReviewContext, type ReviewThread } from "./review-context";
import type { Verdict } from "./verdict-badge";

// ---------------------------------------------------------------------------
// Verdict options
// ---------------------------------------------------------------------------

const VERDICT_OPTIONS: {
  value: Verdict;
  label: string;
  icon: string;
  borderClass: string;
}[] = [
  {
    value: "approved",
    label: "Одобрено",
    icon: "✅",
    borderClass: "border-success",
  },
  {
    value: "needs_work",
    label: "Требует доработки",
    icon: "⚠️",
    borderClass: "border-warning",
  },
  {
    value: "rejected",
    label: "Отклонено",
    icon: "❌",
    borderClass: "border-danger",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getQuotedText(thread: ReviewThread): string | null {
  const anchor = thread.root.anchorData;
  if (!anchor) return thread.root.quotedText;
  try {
    const parsed = JSON.parse(anchor);
    const quote = parsed.selectors?.find(
      (s: { type: string }) => s.type === "TextQuoteSelector",
    );
    if (quote?.exact) return quote.exact;
  } catch {
    // ignore
  }
  return thread.root.quotedText;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  assignmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BatchReviewModal({ assignmentId, onClose, onSuccess }: Props) {
  const { threads } = useReviewContext();

  const pendingThreads = threads.filter((t) => t.root.batchId !== null);

  const [verdict, setVerdict] = useState<Verdict | "">("");
  const [verdictNote, setVerdictNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verdict) {
      setError("Выберите результат ревью");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/submit-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verdict,
            verdictNote: verdictNote.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Ошибка отправки");
        return;
      }
      onSuccess();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-review-title"
        className="bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] flex flex-col"
      >
        <h2 id="batch-review-title" className="text-lg font-semibold mb-4">Отправить ревью</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
          {/* Pending comments preview */}
          {pendingThreads.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Замечания ({pendingThreads.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
                {pendingThreads.map((thread, i) => {
                  const quoted = getQuotedText(thread);
                  return (
                    <div
                      key={thread.root.id}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        {quoted && (
                          <p className="text-muted-foreground italic truncate">
                            {quoted}
                          </p>
                        )}
                        <p className="truncate">{thread.root.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verdict */}
          <div>
            <p className="text-sm font-medium mb-2">Результат ревью</p>
            <div className="space-y-2">
              {VERDICT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    verdict === opt.value
                      ? `${opt.borderClass} bg-accent/10`
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value={opt.value}
                    checked={verdict === opt.value}
                    onChange={() => setVerdict(opt.value)}
                    className="sr-only"
                  />
                  <span>{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Резюме ревью{" "}
              <span className="text-muted-foreground font-normal">
                (опционально)
              </span>
            </label>
            <textarea
              value={verdictNote}
              onChange={(e) => setVerdictNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Общий комментарий к ревью…"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">
              {verdictNote.length}/1000
            </p>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !verdict}
              className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Отправка…" : "Отправить ревью"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
