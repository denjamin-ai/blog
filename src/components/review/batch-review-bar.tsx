"use client";

import { useReviewContext } from "./review-context";

function pluralComments(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} замечание`;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
    return `${n} замечания`;
  return `${n} замечаний`;
}

interface Props {
  onSubmitClick: () => void;
}

export function BatchReviewBar({ onSubmitClick }: Props) {
  const { pendingCount } = useReviewContext();

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-elevated border-t border-border shadow-lg px-4 py-3 animate-slide-up">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {pluralComments(pendingCount)} в черновике
        </p>
        <button
          onClick={onSubmitClick}
          className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Отправить ревью
        </button>
      </div>
    </div>
  );
}
