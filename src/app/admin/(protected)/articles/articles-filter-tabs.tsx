"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { value: "", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "scheduled", label: "Запланированные" },
  { value: "published", label: "Опубликованные" },
] as const;

export function ArticleFilterTabs({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setFilter(tab.value)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            current === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
