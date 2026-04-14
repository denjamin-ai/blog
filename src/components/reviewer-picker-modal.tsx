"use client";

import { useEffect, useRef, useState } from "react";

interface Reviewer {
  id: string;
  name: string;
  username: string;
}

interface ReviewerPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reviewer: Reviewer) => void;
}

export default function ReviewerPickerModal({
  open,
  onClose,
  onSelect,
}: ReviewerPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Debounced search (min 2 chars to avoid large result sets)
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
          `/api/admin/users?role=reviewer&search=${encodeURIComponent(query.trim())}`,
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

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto max-w-md w-full rounded-xl shadow-2xl bg-background border border-border p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-dialog-in"
    >
      <div onClick={(e) => e.stopPropagation()} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Выбрать ревьера</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors text-xl leading-none rounded-md hover:bg-muted"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или никнейм ревьера…"
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
          {error && <p className="text-sm text-red-500 px-3 py-2">{error}</p>}
          {!loading && !error && query.trim() && results.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Ревьеры не найдены
            </p>
          )}
          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {results.map((reviewer) => (
                <li key={reviewer.id}>
                  <button
                    onClick={() => onSelect(reviewer)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-semibold text-sm">
                      {reviewer.name}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {reviewer.username}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length < 2 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Введите минимум 2 символа для поиска
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
