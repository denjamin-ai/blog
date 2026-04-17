"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReviewContext } from "./review-context";
import { computeWordDiff, type DiffChunk } from "@/lib/diff";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiffData {
  old: string;
  new: string;
  hasChanges: boolean;
}

interface ChangedBlock {
  paragraphIndex: number;
  chunks: DiffChunk[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split MDX content into paragraph-level blocks (double-newline separated). */
function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  diffEndpoint?: string;
}

export function DiffOverlay({ diffEndpoint }: Props) {
  const { assignmentId, articleRef } = useReviewContext();

  const [enabled, setEnabled] = useState(false);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(false);
  const appliedRef = useRef(false);

  // Fetch diff data
  const fetchDiff = useCallback(async () => {
    setLoading(true);
    try {
      const url = diffEndpoint ?? `/api/reviewer/assignments/${assignmentId}/diff`;
      const res = await fetch(url);
      if (res.ok) {
        const data: DiffData = await res.json();
        setDiffData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // Fetch on first enable
  useEffect(() => {
    if (enabled && !diffData && !loading) {
      fetchDiff();
    }
  }, [enabled, diffData, loading, fetchDiff]);

  // Find changed blocks by comparing paragraphs
  const changedBlocks = useMemo<ChangedBlock[]>(() => {
    if (!diffData || !diffData.hasChanges) return [];

    const oldParas = splitParagraphs(diffData.old);
    const newParas = splitParagraphs(diffData.new);

    const blocks: ChangedBlock[] = [];
    const maxLen = Math.max(oldParas.length, newParas.length);

    for (let i = 0; i < maxLen; i++) {
      const oldP = oldParas[i] ?? "";
      const newP = newParas[i] ?? "";
      if (oldP !== newP) {
        blocks.push({
          paragraphIndex: i,
          chunks: computeWordDiff(oldP, newP),
        });
      }
    }
    return blocks;
  }, [diffData]);

  // Apply CSS classes to article DOM nodes
  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;

    // Clean up previous classes
    container
      .querySelectorAll(".review-diff-changed")
      .forEach((el) => el.classList.remove("review-diff-changed"));
    appliedRef.current = false;

    if (!enabled || changedBlocks.length === 0) return;

    // Get top-level block elements in the article
    const blockEls = Array.from(container.children).filter((el) => {
      const tag = el.tagName.toLowerCase();
      // Skip non-content elements
      return !["style", "script"].includes(tag);
    });

    for (const block of changedBlocks) {
      const el = blockEls[block.paragraphIndex];
      if (el) {
        el.classList.add("review-diff-changed");
      }
    }
    appliedRef.current = true;

    return () => {
      // Cleanup on unmount or dep change
      container
        .querySelectorAll(".review-diff-changed")
        .forEach((el) => el.classList.remove("review-diff-changed"));
    };
  }, [enabled, changedBlocks, articleRef]);

  const hasChanges = diffData?.hasChanges ?? false;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Показать изменения"
        onClick={() => setEnabled((v) => !v)}
        disabled={diffData !== null && !hasChanges}
        className={`inline-flex items-center gap-2 text-xs cursor-pointer select-none ${
          diffData && !hasChanges ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span
          className={`relative w-8 h-4 rounded-full transition-colors ${enabled ? "bg-accent" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-background transition-transform ${enabled ? "translate-x-4" : ""}`}
          />
        </span>
        <span className="text-muted-foreground">
          {loading ? "Загрузка…" : "Показать изменения"}
        </span>
      </button>

      {/* Badge */}
      {enabled && changedBlocks.length > 0 && (
        <span className="bg-info-bg text-info rounded px-2 py-1 text-xs">
          Изменено с момента ревью: {changedBlocks.length}{" "}
          {changedBlocks.length === 1
            ? "блок"
            : changedBlocks.length < 5
              ? "блока"
              : "блоков"}
        </span>
      )}

      {enabled && diffData && !hasChanges && (
        <span className="text-xs text-muted-foreground">
          Изменений нет
        </span>
      )}
    </div>
  );
}
