"use client";

import { useEffect, useState } from "react";
import { computeDiff, type DiffChunk } from "@/lib/diff";

interface DiffData {
  old: string;
  new: string;
  hasChanges: boolean;
}

interface Props {
  assignmentId: string;
  diffUrl?: string;
}

export function DiffView({ assignmentId, diffUrl }: Props) {
  const [data, setData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diff" | "full">("diff");

  useEffect(() => {
    fetch(diffUrl ?? `/api/reviewer/assignments/${assignmentId}/diff`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Ошибка загрузки");
        }
        return res.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-8 text-center">
        Загрузка изменений…
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-danger px-4 py-8 text-center">{error}</p>;
  }

  if (!data) return null;

  if (!data.hasChanges) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-8 text-center">
        Статья не менялась с момента назначения ревью.
      </p>
    );
  }

  const chunks: DiffChunk[] = computeDiff(data.old, data.new);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 px-4 py-2 border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab("diff")}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            activeTab === "diff"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Diff
        </button>
        <button
          onClick={() => setActiveTab("full")}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            activeTab === "full"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Полный текст
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "diff" ? (
          <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">
            {chunks.map((chunk, i) => {
              if (chunk.type === "added") {
                return (
                  <span key={i} className="bg-success-bg text-success">
                    {chunk.value}
                  </span>
                );
              }
              if (chunk.type === "removed") {
                return (
                  <span
                    key={i}
                    className="bg-danger-bg text-danger line-through"
                  >
                    {chunk.value}
                  </span>
                );
              }
              return (
                <span key={i} className="text-muted-foreground">
                  {chunk.value}
                </span>
              );
            })}
          </pre>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed text-foreground">
            {data.new}
          </pre>
        )}
      </div>
    </div>
  );
}
