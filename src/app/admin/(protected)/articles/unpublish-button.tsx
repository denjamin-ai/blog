"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnpublishButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnpublish() {
    if (!confirm("Снять статью с публикации?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUnpublish}
      disabled={loading}
      className="text-sm text-warning hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Скрыть"}
    </button>
  );
}
