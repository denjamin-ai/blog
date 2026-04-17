"use client";

import { useEffect, useRef, useState } from "react";
import type { DifficultyLevel } from "@/types";

interface Reviewer {
  id: string;
  name: string;
  username: string;
}

interface ReviewerPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reviewers: Reviewer[]) => void;
  difficulty?: DifficultyLevel | null;
  maxReviewers?: number;
}

export default function ReviewerPickerModal({
  open,
  onClose,
  onSelect,
  difficulty,
  maxReviewers = 3,
}: ReviewerPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Reviewer[]>([]);
  const [selected, setSelected] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minRequired = difficulty === "hard" ? 2 : 1;

  // Open/close dialog programmatically
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
      setQuery("");
      setResults([]);
      setSelected([]);
      setError("");
    }
  }, [open]);

  // Close on native dialog close (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Debounced search (min 2 chars)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/reviewers?search=${encodeURIComponent(query.trim())}`,
        );
        if (!res.ok) {
          setError("Ошибка поиска");
          return;
        }
        const data = await res.json();
        setResults(data);
      } catch {
        setError("Ошибка сети");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  }

  function toggleReviewer(reviewer: Reviewer) {
    setSelected((prev) => {
      const isSelected = prev.some((r) => r.id === reviewer.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== reviewer.id);
      }
      if (prev.length >= maxReviewers) return prev;
      return [...prev, reviewer];
    });
  }

  function handleConfirm() {
    onSelect(selected);
    onClose();
  }

  const isConfirmDisabled =
    selected.length === 0 ||
    selected.length < minRequired ||
    selected.length > maxReviewers;

  const selectedIds = new Set(selected.map((r) => r.id));
  // Ревьюеры в результатах, которых нет в selected
  const unselectedResults = results.filter((r) => !selectedIds.has(r.id));

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="Выбрать ревьюеров"
      className="m-auto max-w-md w-full rounded-xl bg-background border border-border p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-dialog-in"
    >
      <div onClick={(e) => e.stopPropagation()} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Выбрать ревьюеров</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors text-xl leading-none rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Счётчик и минимум */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-muted-foreground">
            {minRequired === 2
              ? "Нужно минимум 2 ревьюера"
              : "Нужен минимум 1 ревьюер"}
          </span>
          <span
            className={
              selected.length >= minRequired
                ? "text-success font-semibold"
                : "text-muted-foreground"
            }
          >
            Выбрано: {selected.length} из {maxReviewers}
          </span>
        </div>

        {/* Выбранные ревьюеры */}
        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selected.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold"
              >
                {r.name}
                <button
                  onClick={() => toggleReviewer(r)}
                  aria-label={`Убрать ${r.name}`}
                  className="ml-0.5 hover:text-danger transition-colors focus-visible:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или никнейм ревьюера…"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent mb-3"
          autoFocus
        />

        <div className="min-h-[80px]">
          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
          {error && <p className="text-sm text-danger px-3 py-2">{error}</p>}
          {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Ревьюеры не найдены
            </p>
          )}
          {!loading && !error && unselectedResults.length > 0 && (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {unselectedResults.map((reviewer) => {
                const isSelected = selectedIds.has(reviewer.id);
                const canAdd = selected.length < maxReviewers;
                return (
                  <li key={reviewer.id}>
                    <button
                      onClick={() => toggleReviewer(reviewer)}
                      disabled={!canAdd && !isSelected}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={`${isSelected ? "Убрать" : "Выбрать"} ${reviewer.name}`}
                    >
                      {/* Чекбокс */}
                      <span
                        className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-accent border-accent"
                            : "border-border"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="font-semibold text-sm">{reviewer.name}</span>
                      <span className="text-muted-foreground text-sm">{reviewer.username}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {query.trim().length < 2 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Введите минимум 2 символа для поиска
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </dialog>
  );
}
