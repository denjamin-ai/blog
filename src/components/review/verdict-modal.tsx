"use client";

import { useState } from "react";
import type { Verdict } from "./verdict-badge";

interface Props {
  assignmentId: string;
  openComments: number;
  onClose: () => void;
  onSuccess: () => void;
}

const VERDICT_OPTIONS: { value: Verdict; label: string; icon: string }[] = [
  { value: "approved", label: "Одобрено", icon: "✅" },
  { value: "needs_work", label: "Требует доработки", icon: "⚠️" },
  { value: "rejected", label: "Отклонено", icon: "❌" },
];

export function VerdictModal({
  assignmentId,
  openComments,
  onClose,
  onSuccess,
}: Props) {
  const [verdict, setVerdict] = useState<Verdict | "">("");
  const [verdictNote, setVerdictNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verdict) {
      setError("Выберите результат ревью");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviewer/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          verdict,
          verdictNote: verdictNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Ошибка сохранения");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Завершить ревью</h2>

        {openComments > 0 && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
            У вас {openComments} открытых замечани
            {openComments === 1 ? "е" : openComments < 5 ? "я" : "й"}. Ревью
            будет завершено в любом случае.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Результат ревью</p>
            <div className="space-y-2">
              {VERDICT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    verdict === opt.value
                      ? "border-accent bg-accent/10"
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
              rows={4}
              placeholder="Общий комментарий к ревью…"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">
              {verdictNote.length}/1000
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

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
              {submitting ? "Сохранение…" : "Подтвердить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
