"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import { DiagramInserter } from "./diagram-inserter";
import { FormulaInserter } from "./formula-inserter";

type Layout = "right" | "left" | "bottom" | "none";
type ActiveTool = "diagram" | "formula" | null;

interface EditorWithPreviewProps {
  value: string;
  children: ReactNode;
  /** Вызывается при клике кнопки «Медиа» в тулбаре */
  onMediaClick?: () => void;
  uploadingMedia?: boolean;
  /** Коллбэк вставки диаграммы (если не передан — кнопка скрыта) */
  onDiagramInsert?: (text: string) => void;
  /** Коллбэк вставки формулы (если не передан — кнопка скрыта) */
  onFormulaInsert?: (text: string) => void;
}

const LAYOUT_STORAGE_KEY = "editor_preview_layout";

// ─── Layout icons ───────────────────────────────────────────────────────────

function IconNone() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1.5" />
    </svg>
  );
}
function IconRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1.5" />
      <line x1="8.5" y1="1" x2="8.5" y2="15" />
    </svg>
  );
}
function IconLeft() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1.5" />
      <line x1="7.5" y1="1" x2="7.5" y2="15" />
    </svg>
  );
}
function IconBottom() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1.5" />
      <line x1="1" y1="8.5" x2="15" y2="8.5" />
    </svg>
  );
}

// ─── Shared button primitives ────────────────────────────────────────────────

/** Кнопка тулбара с текстом + иконкой — для диаграммы, формулы, медиа */
function ToolBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-muted border-border text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** Кнопка переключения режима предпросмотра — иконка без текста */
function LayoutBtn({
  onClick,
  active,
  label,
  hideOnMobile,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  hideOnMobile?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={[
        "p-1.5 rounded-lg border transition-colors",
        hideOnMobile ? "hidden sm:inline-flex" : "inline-flex",
        "items-center justify-center",
        active
          ? "bg-accent/10 text-accent border-accent/30"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Preview skeleton ────────────────────────────────────────────────────────

function PreviewSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-16 bg-muted rounded w-full mt-4" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function EditorWithPreview({
  value,
  children,
  onMediaClick,
  uploadingMedia = false,
  onDiagramInsert,
  onFormulaInsert,
}: EditorWithPreviewProps) {
  const [layout, setLayout] = useState<Layout>("none");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Init layout from localStorage (avoid SSR hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY) as Layout | null;
    if (stored && ["right", "left", "bottom", "none"].includes(stored)) {
      const isMobile = window.innerWidth < 768;
      setLayout(
        isMobile && (stored === "right" || stored === "left") ? "none" : stored,
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  }, [layout]);

  // Debounced preview fetch
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (layout === "none") return;
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPreviewHtml(data.html);
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : "Ошибка предпросмотра");
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [value, layout]);

  // Mermaid in preview pane
  useEffect(() => {
    if (!previewHtml || !previewRef.current) return;
    const nodes = Array.from(
      previewRef.current.querySelectorAll<HTMLElement>("pre.mermaid"),
    );
    if (!nodes.length) return;
    let cancelled = false;
    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark")
          ? "dark"
          : "default",
      });
      mermaid.run({ nodes });
    });
    return () => {
      cancelled = true;
    };
  }, [previewHtml]);

  // Drag handle
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio =
        layout === "bottom"
          ? (e.clientY - rect.top) / rect.height
          : (e.clientX - rect.left) / rect.width;
      const clamped = Math.min(Math.max(ratio, 0.2), 0.8);
      setSplitRatio(clamped);
      containerRef.current.style.setProperty("--split", clamped * 100 + "%");
    },
    [layout],
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    isDragging.current = true;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function toggleTool(tool: ActiveTool) {
    setActiveTool((prev) => (prev === tool ? null : tool));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasContentTools = onDiagramInsert || onFormulaInsert || onMediaClick;

  const toolbar = (
    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
      {/* Left: content insertion tools */}
      {hasContentTools && (
        <div className="flex items-center gap-1 flex-wrap">
          {onDiagramInsert && (
            <ToolBtn
              onClick={() => toggleTool("diagram")}
              active={activeTool === "diagram"}
              title="Диаграмма"
            >
              {/* grid icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M17.5 14v7M14 17.5h7" />
              </svg>
              Диаграмма
            </ToolBtn>
          )}

          {onFormulaInsert && (
            <ToolBtn
              onClick={() => toggleTool("formula")}
              active={activeTool === "formula"}
              title="Формула"
            >
              <span className="text-sm leading-none" aria-hidden="true">
                ∑
              </span>
              Формула
            </ToolBtn>
          )}

          {(onDiagramInsert || onFormulaInsert) && onMediaClick && (
            <div
              className="w-px h-4 bg-border mx-0.5 self-center"
              aria-hidden="true"
            />
          )}

          {onMediaClick && (
            <ToolBtn
              onClick={onMediaClick}
              disabled={uploadingMedia}
              title="Добавить медиа"
            >
              {/* upload icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploadingMedia ? "Загрузка..." : "Медиа"}
            </ToolBtn>
          )}
        </div>
      )}

      {/* Right: preview layout */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-muted-foreground mr-1 select-none">
          Предпросмотр
        </span>
        <LayoutBtn
          onClick={() => setLayout("none")}
          active={layout === "none"}
          label="Без предпросмотра"
        >
          <IconNone />
        </LayoutBtn>
        <LayoutBtn
          onClick={() => setLayout("right")}
          active={layout === "right"}
          label="Предпросмотр справа"
          hideOnMobile
        >
          <IconRight />
        </LayoutBtn>
        <LayoutBtn
          onClick={() => setLayout("left")}
          active={layout === "left"}
          label="Предпросмотр слева"
          hideOnMobile
        >
          <IconLeft />
        </LayoutBtn>
        <LayoutBtn
          onClick={() => setLayout("bottom")}
          active={layout === "bottom"}
          label="Предпросмотр снизу"
        >
          <IconBottom />
        </LayoutBtn>
      </div>
    </div>
  );

  const previewPane = (
    <div className="overflow-auto border border-border rounded-lg bg-background min-h-[200px]">
      {loading && <PreviewSkeleton />}
      {!loading && fetchError && (
        <p className="p-4 text-sm text-danger">{fetchError}</p>
      )}
      {!loading && !fetchError && previewHtml && (
        <div
          ref={previewRef}
          className="prose p-4"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
      {!loading && !fetchError && !previewHtml && (
        <p className="p-4 text-xs text-muted-foreground">
          Начните вводить текст для предпросмотра...
        </p>
      )}
    </div>
  );

  const dragHandle =
    layout === "bottom" ? (
      <div
        onPointerDown={onPointerDown}
        className="h-1.5 cursor-row-resize flex items-center justify-center group"
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="w-10 h-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
      </div>
    ) : (
      <div
        onPointerDown={onPointerDown}
        className="w-1.5 cursor-col-resize flex items-center justify-center group"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="w-1 h-10 rounded-full bg-border group-hover:bg-accent transition-colors" />
      </div>
    );

  const gridStyle: CSSProperties & { "--split"?: string } = {
    "--split": splitRatio * 100 + "%",
  };
  const gridTemplateStyle: CSSProperties =
    layout === "right"
      ? { gridTemplateColumns: "var(--split, 50%) 6px 1fr" }
      : layout === "left"
        ? { gridTemplateColumns: "1fr 6px var(--split, 50%)" }
        : {};

  return (
    <div>
      {toolbar}

      {/* Expandable tool panels */}
      {onDiagramInsert && (
        <DiagramInserter
          onInsert={onDiagramInsert}
          open={activeTool === "diagram"}
          onClose={() => setActiveTool(null)}
        />
      )}
      {onFormulaInsert && (
        <FormulaInserter
          onInsert={onFormulaInsert}
          open={activeTool === "formula"}
          onClose={() => setActiveTool(null)}
        />
      )}

      {/* Editor / split layout */}
      {layout === "none" ? (
        <div>{children}</div>
      ) : (
        <div
          ref={containerRef}
          className={layout === "bottom" ? "flex flex-col" : "grid"}
          style={{ ...gridStyle, ...gridTemplateStyle, minHeight: "300px" }}
        >
          {layout === "left" && (
            <>
              {previewPane}
              {dragHandle}
              <div className="min-w-0">{children}</div>
            </>
          )}
          {layout === "right" && (
            <>
              <div className="min-w-0">{children}</div>
              {dragHandle}
              {previewPane}
            </>
          )}
          {layout === "bottom" && (
            <>
              <div>{children}</div>
              {dragHandle}
              {previewPane}
            </>
          )}
        </div>
      )}
    </div>
  );
}
