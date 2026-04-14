"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScheduleActionsButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function publishNow() {
    setLoading(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveMode: "publish" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function cancelSchedule() {
    setLoading(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveMode: "draft" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={publishNow}
        disabled={loading}
        className="text-sm text-accent hover:underline disabled:opacity-50"
      >
        Опубликовать
      </button>
      <button
        onClick={cancelSchedule}
        disabled={loading}
        className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        Отменить
      </button>
    </>
  );
}
