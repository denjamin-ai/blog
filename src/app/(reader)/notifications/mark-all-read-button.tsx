"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Отметить все прочитанными"}
    </button>
  );
}
