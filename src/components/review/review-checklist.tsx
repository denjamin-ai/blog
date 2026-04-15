"use client";

import { useCallback, useEffect, useState } from "react";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface Props {
  assignmentId: string;
  readOnly?: boolean;
}

export function ReviewChecklist({ assignmentId, readOnly = false }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/checklist`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(index: number) {
    if (readOnly || saving !== null) return;
    const prev = [...items];
    const next = items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item,
    );
    setItems(next);
    setSaving(String(index));
    try {
      await fetch(`/api/reviewer/assignments/${assignmentId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
    } catch {
      // rollback on error
      setItems(prev);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return null;
  if (items.length === 0) return null;

  const checkedCount = items.filter((i) => i.checked).length;
  const total = items.length;

  return (
    <div className="px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">Чеклист</span>
        <span className="text-xs text-muted-foreground">
          Проверено {checkedCount} из {total}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.checked}
              onClick={() => handleToggle(i)}
              disabled={readOnly || saving !== null}
              className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                item.checked
                  ? "bg-accent border-accent text-accent-foreground"
                  : "border-border bg-background"
              } ${readOnly ? "cursor-default" : "cursor-pointer hover:border-accent/70"} disabled:opacity-60`}
            >
              {item.checked && (
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={`text-xs leading-relaxed ${
                item.checked
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
