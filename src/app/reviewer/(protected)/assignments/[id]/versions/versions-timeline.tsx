"use client";

import { useState } from "react";

interface VersionEntry {
  id: string;
  title: string;
  createdAt: number;
  changeNote: string | null;
  contentPreview: string;
  isReviewVersion: boolean;
  content: React.ReactNode;
}

interface Props {
  versions: VersionEntry[];
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionsTimeline({ versions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Нет доступных версий
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

      {versions.map((v) => {
        const isExpanded = expandedId === v.id;
        return (
          <div key={v.id} className="relative pl-8 pb-8 last:pb-0">
            {/* Dot marker */}
            <div
              className={`absolute left-1 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                v.isReviewVersion
                  ? "bg-accent border-accent"
                  : "bg-background border-border"
              }`}
            />

            {/* Version card */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
              className="w-full text-left group"
              aria-expanded={isExpanded}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <span className="text-sm text-muted-foreground">
                  {formatDate(v.createdAt)}
                </span>
                {v.isReviewVersion && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                    Версия для ревью
                  </span>
                )}
              </div>

              <p className="text-sm font-medium mb-1 group-hover:text-accent transition-colors">
                {v.changeNote ?? (
                  <span className="text-muted-foreground italic">
                    Без описания
                  </span>
                )}
              </p>

              {!isExpanded && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {v.contentPreview}
                </p>
              )}

              <span className="text-xs text-accent mt-1 inline-block">
                {isExpanded ? "Свернуть ↑" : "Показать содержимое ↓"}
              </span>
            </button>

            {/* Expanded MDX content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-border">
                <article className="prose dark:prose-invert max-w-3xl">
                  {v.content}
                </article>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
