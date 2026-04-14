"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  articleId: string;
  initialBookmarked: boolean;
  initialCount: number;
}

export function BookmarkButton({
  articleId,
  initialBookmarked,
  initialCount,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [notAuthed, setNotAuthed] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (res.status === 401 || res.status === 403) {
        setNotAuthed(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { bookmarked: boolean };
        setBookmarked(data.bookmarked);
        setCount((prev) => prev + (data.bookmarked ? 1 : -1));
        setNotAuthed(false);
      }
    } catch {
      // сеть недоступна
    } finally {
      setLoading(false);
    }
  }

  if (notAuthed) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Войдите, чтобы добавить в закладки
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={bookmarked ? "Убрать из закладок" : "В закладки"}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
