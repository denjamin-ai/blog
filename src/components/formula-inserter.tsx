"use client";

import { useState } from "react";
import katex from "katex";

interface FormulaInserterProps {
  onInsert: (text: string) => void;
  open: boolean;
  onClose: () => void;
}

const QUICK_SYMBOLS = [
  { label: "∑", latex: "\\sum" },
  { label: "∫", latex: "\\int" },
  { label: "√", latex: "\\sqrt{}" },
  { label: "∂", latex: "\\partial" },
  { label: "α", latex: "\\alpha" },
  { label: "β", latex: "\\beta" },
  { label: "γ", latex: "\\gamma" },
  { label: "θ", latex: "\\theta" },
  { label: "λ", latex: "\\lambda" },
  { label: "π", latex: "\\pi" },
  {
    label: "Матрица",
    latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
  },
] as const;

export function FormulaInserter({
  onInsert,
  open,
  onClose,
}: FormulaInserterProps) {
  const [formula, setFormula] = useState("");
  const [mode, setMode] = useState<"inline" | "block">("inline");

  if (!open) return null;

  let previewHtml = "";
  let renderError = "";
  if (formula.trim()) {
    try {
      previewHtml = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: mode === "block",
      });
    } catch (e) {
      renderError = e instanceof Error ? e.message : "Ошибка рендера";
    }
  }

  function handleInsert() {
    if (!formula.trim()) return;
    const text = mode === "inline" ? `$${formula}$` : `$$\n${formula}\n$$`;
    onInsert(text);
    setFormula("");
    onClose();
  }

  return (
    <div className="mb-2 p-3 border border-border rounded-lg bg-muted/30 space-y-3">
      {/* Inline / block toggle */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode("inline")}
          aria-pressed={mode === "inline"}
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
            mode === "inline"
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border hover:bg-muted"
          }`}
        >
          Inline <code className="opacity-70">$...$</code>
        </button>
        <button
          type="button"
          onClick={() => setMode("block")}
          aria-pressed={mode === "block"}
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
            mode === "block"
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border hover:bg-muted"
          }`}
        >
          Block <code className="opacity-70">$$...$$</code>
        </button>
      </div>

      {/* Quick symbols */}
      <div className="flex flex-wrap gap-1">
        {QUICK_SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            type="button"
            onClick={() => setFormula((prev) => prev + sym.latex)}
            title={sym.latex}
            className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors font-mono"
          >
            {sym.label}
          </button>
        ))}
      </div>

      {/* LaTeX input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          LaTeX
        </label>
        <textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          rows={3}
          placeholder={
            mode === "inline" ? "E = mc^2" : "\\int_0^\\infty e^{-x}\\,dx = 1"
          }
          className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm resize-none"
        />
      </div>

      {/* Preview */}
      {formula.trim() && (
        <div className="min-h-[2.5rem] px-3 py-2 border border-border rounded-lg bg-background overflow-auto">
          {renderError ? (
            <p className="text-xs text-danger">{renderError}</p>
          ) : (
            <div
              className={mode === "block" ? "text-center" : ""}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Закрыть
        </button>
        <button
          type="button"
          onClick={handleInsert}
          disabled={!formula.trim()}
          className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 font-medium"
        >
          Вставить формулу
        </button>
      </div>
    </div>
  );
}
