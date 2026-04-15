"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AuthorNewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(status: "draft" | "published") {
    setError("");
    setSaving(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, excerpt, tags, content, status }),
      });

      if (res.ok) {
        const { id } = await res.json();
        router.push(`/author/articles/${id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Новая статья</h1>

      <div className="space-y-4 max-w-4xl">
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок</label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugManuallyEdited) {
                setSlug(slugify(e.target.value));
              }
            }}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Заголовок статьи"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="url-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Краткое описание для карточки"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Теги (через запятую)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="react, typescript, nextjs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Контент (MDX)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            placeholder="# Заголовок&#10;&#10;Текст статьи в формате MDX..."
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || !title || !slug}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить черновик"}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving || !title || !slug}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  );
}
