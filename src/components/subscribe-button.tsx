"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  authorId: string;
  authorName: string;
  initialSubscribed: boolean;
}

export function SubscribeButton({
  authorId,
  authorName,
  initialSubscribed,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [notAuthed, setNotAuthed] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId }),
      });
      if (res.status === 401 || res.status === 403) {
        setNotAuthed(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { subscribed: boolean };
        setSubscribed(data.subscribed);
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
        Войдите, чтобы подписаться на {authorName}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        subscribed
          ? "border-accent bg-accent text-accent-foreground hover:opacity-80"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {loading ? "…" : subscribed ? "Вы подписаны" : "Подписаться"}
    </button>
  );
}
