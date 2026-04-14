"use client";

import { useEffect, useState } from "react";

export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications?unread=1");
        if (!res.ok) return;
        const data = await res.json();
        setCount(
          typeof data.total === "number"
            ? data.total
            : Array.isArray(data.notifications)
              ? data.notifications.length
              : 0,
        );
      } catch {
        // ignore network errors silently
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}
