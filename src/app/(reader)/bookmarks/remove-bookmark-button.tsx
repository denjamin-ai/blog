"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveBookmarkButton({ articleId }: { articleId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setLoading(true);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="shrink-0 text-xs text-muted-foreground hover:text-danger transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Убрать"}
    </button>
  );
}
