"use client";

import { useState } from "react";

interface Props {
  variant: "comment" | "reply";
  commentVersionId: string;
  currentVersionId?: string | null;
}

function ulidToDate(id: string): Date {
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const timeStr = id.slice(0, 10).toUpperCase();
  let ms = 0;
  for (const char of timeStr) {
    ms = ms * 32 + ENCODING.indexOf(char);
  }
  return new Date(ms);
}

function formatDate(id: string): string {
  return ulidToDate(id).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function VersionWarning({
  variant,
  commentVersionId,
  currentVersionId,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (variant === "reply" && !currentVersionId) return null;

  const message =
    variant === "comment"
      ? "Этот комментарий оставлен к другой версии статьи"
      : `Вы отвечаете на комментарий к версии от ${formatDate(commentVersionId)}. Текущая версия от ${formatDate(currentVersionId!)}.`;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs motion-safe:animate-fade-in
        bg-warning-bg border-warning-border text-warning"
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:opacity-70 transition-opacity leading-none mt-0.5"
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  );
}
