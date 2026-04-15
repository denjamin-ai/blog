"use client";

import { useCallback, useEffect, useState } from "react";

export function ChecklistTemplateEditor() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/checklist");
      if (res.ok) {
        const data = await res.json();
        setItems((data.items as { text: string }[]).map((i) => i.text));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(index: number, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
    setSaved(false);
  }

  function handleAdd() {
    setItems((prev) => [...prev, ""]);
    setSaved(false);
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setSaved(false);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setSaved(true);
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Шаблон пуст. Добавьте пункты ниже.
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {i + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder="Текст пункта"
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => handleMoveUp(i)}
              disabled={i === 0}
              className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              aria-label="Переместить вверх"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleMoveDown(i)}
              disabled={i === items.length - 1}
              className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              aria-label="Переместить вниз"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="px-1.5 py-1 text-xs text-danger hover:opacity-70 transition-opacity"
              aria-label="Удалить пункт"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          + Добавить пункт
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        {saved && <span className="text-xs text-success">Сохранено ✓</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Шаблон применяется при создании новых назначений. Уже созданные
          чеклисты не изменяются.
        </p>
      )}
    </div>
  );
}
