"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditorWithPreview } from "@/components/editor-with-preview";
import { useArticleEditor } from "@/hooks/useArticleEditor";

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

  const editor = useArticleEditor(content, setContent);
  const [mediaDimWidth, setMediaDimWidth] = useState("");
  const [mediaDimHeight, setMediaDimHeight] = useState("");

  useEffect(() => {
    if (editor.mediaPreview) {
      setMediaDimWidth(editor.mediaPreview.width?.toString() ?? "");
      setMediaDimHeight(editor.mediaPreview.height?.toString() ?? "");
    }
  }, [editor.mediaPreview]);

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
      </div>

      {/* Контент — вне max-w-4xl, чтобы split-preview мог раскрыться на полную ширину */}
      <div className="my-4">
        <EditorWithPreview
          value={content}
          onDiagramInsert={editor.insertAtCursor}
          onFormulaInsert={editor.insertAtCursor}
          onMediaClick={() => editor.mediaFileInputRef.current?.click()}
          uploadingMedia={editor.uploadingMedia}
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Контент (MDX)
            </label>

            <input
              ref={editor.mediaFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) editor.handleMediaUpload(f);
                e.target.value = "";
              }}
            />

            {editor.uploadingMedia && (
              <div className="mb-2 h-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-150"
                  style={{ width: `${editor.mediaUploadProgress}%` }}
                />
              </div>
            )}

            {editor.mediaUploadError && (
              <p className="text-xs text-danger mb-2">
                {editor.mediaUploadError}
              </p>
            )}

            {editor.mediaPreview && (
              <div className="mb-2 p-3 border border-border rounded-lg flex items-start gap-3 bg-muted/30">
                {editor.mediaPreview.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editor.mediaPreview.url}
                    alt=""
                    className="w-20 h-14 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <video
                    src={editor.mediaPreview.url}
                    className="w-20 h-14 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {editor.mediaPreview.name}
                  </p>
                  {editor.mediaPreview.duration !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round(editor.mediaPreview.duration)} сек
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="number"
                      min={1}
                      placeholder="Ширина"
                      value={mediaDimWidth}
                      onChange={(e) => setMediaDimWidth(e.target.value)}
                      className="w-20 px-2 py-0.5 border border-border rounded text-xs bg-background"
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                    <input
                      type="number"
                      min={1}
                      placeholder="Высота"
                      value={mediaDimHeight}
                      onChange={(e) => setMediaDimHeight(e.target.value)}
                      className="w-20 px-2 py-0.5 border border-border rounded text-xs bg-background"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    editor.insertMediaTag(
                      editor.mediaPreview!.url,
                      editor.mediaPreview!.type,
                      mediaDimWidth ? parseInt(mediaDimWidth) : undefined,
                      mediaDimHeight ? parseInt(mediaDimHeight) : undefined,
                    )
                  }
                  className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  Вставить
                </button>
                <button
                  type="button"
                  onClick={() => editor.setMediaPreview(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm flex-shrink-0"
                  aria-label="Закрыть превью"
                >
                  ✕
                </button>
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) editor.handleMediaUpload(f);
              }}
            >
              <textarea
                ref={editor.textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={editor.trackCursor}
                onKeyUp={editor.trackCursor}
                onClick={editor.trackCursor}
                rows={20}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                placeholder="Текст статьи в формате MDX..."
              />
            </div>
          </div>
        </EditorWithPreview>
      </div>

      <div className="max-w-4xl space-y-4">
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
