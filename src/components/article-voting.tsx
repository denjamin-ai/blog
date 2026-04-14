"use client";

import { useEffect, useState } from "react";

interface Props {
  articleId: string;
  initialRating: number;
}

export function ArticleVoting({ articleId, initialRating }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${articleId}/votes`)
      .then((r) => {
        if (r.status === 401) {
          setAuthed(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setRating(data.rating ?? initialRating);
          setUserVote(data.userVote ?? null);
          setAuthed(true);
        }
      })
      .catch(() => {});
  }, [articleId, initialRating]);

  async function vote(value: 1 | -1) {
    if (loading || !authed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as {
          userVote: 1 | -1 | null;
          rating: number;
        };
        setRating(data.rating);
        setUserVote(data.userVote);
      }
    } catch {
      // сеть недоступна
    } finally {
      setLoading(false);
    }
  }

  const btnBase =
    "flex items-center justify-center w-7 h-7 rounded transition-colors";
  const activeUp =
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950";
  const activeDown =
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950";
  const idle =
    "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40";

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => vote(1)}
        disabled={loading || !authed}
        title={authed ? "Нравится" : "Войдите, чтобы голосовать"}
        className={`${btnBase} ${userVote === 1 ? activeUp : idle}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <span className="text-sm font-medium tabular-nums w-6 text-center">
        {rating > 0 ? `+${rating}` : rating}
      </span>

      <button
        onClick={() => vote(-1)}
        disabled={loading || !authed}
        title={authed ? "Не нравится" : "Войдите, чтобы голосовать"}
        className={`${btnBase} ${userVote === -1 ? activeDown : idle}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
