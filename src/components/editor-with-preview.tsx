"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";

type Layout = "right" | "left" | "bottom" | "none";

interface EditorWithPreviewProps {
  value: string;
  children: ReactNode;
  formulaInserter?: ReactNode;
  diagramInserter?: ReactNode;
}

const LAYOUT_STORAGE_KEY = "editor_preview_layout";

// Layout toolbar icons as inline SVG
function IconNone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
function IconRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1" />
      <line x1="8.5" y1="1" x2="8.5" y2="15" />
    </svg>
  );
}
function IconLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1" />
      <line x1="7.5" y1="1" x2="7.5" y2="15" />
    </svg>
  );
}
function IconBottom() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="14" height="14" rx="1" />
      <line x1="1" y1="8.5" x2="15" y2="8.5" />
    </svg>
  );
}

function PreviewSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="h-16 bg-muted rounded w-full mt-4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  );
}

export function EditorWithPreview({
  value,
  children,
  formulaInserter,
  diagramInserter,
}: EditorWithPreviewProps) {
  const [layout, setLayout] = useState<Layout>("none");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Init layout from localStorage after mount (avoid SSR hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY) as Layout | null;
    if (stored && ["right", "left", "bottom", "none"].includes(stored)) {
      // On mobile, reset horizontal splits
      const isMobile = window.innerWidth < 768;
      if (isMobile && (stored === "right" || stored === "left")) {
        setLayout("none");
      } else {
        setLayout(stored);
      }
    }
  }, []);

  // Persist layout choice
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

  // Run Mermaid on <pre class="mermaid"> elements in preview pane after HTML updates
  useEffect(() => {
    if (!previewHtml || !previewRef.current) return;
    const nodes = Array.from(
      previewRef.current.querySelectorAll<HTMLElement>("pre.mermaid"),
    );
    if (nodes.length === 0) return;
    let cancelled = false;
    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;
      const isDark = document.documentElement.classList.contains("dark");
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
      });
      mermaid.run({ nodes });
    });
    return () => {
      cancelled = true;
    };
  }, [previewHtml]);

  // Drag handle logic
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

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

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

  const gridClassName =
    layout === "right"
      ? "grid"
      : layout === "left"
        ? "grid"
        : layout === "bottom"
          ? "flex flex-col"
          : "";

  const gridTemplateStyle: CSSProperties =
    layout === "right"
      ? { gridTemplateColumns: "var(--split, 50%) 6px 1fr" }
      : layout === "left"
        ? { gridTemplateColumns: "1fr 6px var(--split, 50%)" }
        : {};

  const layoutButtons: {
    mode: Layout;
    label: string;
    icon: ReactNode;
    hideOnMobile?: boolean;
  }[] = [
    { mode: "none", label: "Без предпросмотра", icon: <IconNone /> },
    {
      mode: "right",
      label: "Предпросмотр справа",
      icon: <IconRight />,
      hideOnMobile: true,
    },
    {
      mode: "left",
      label: "Предпросмотр слева",
      icon: <IconLeft />,
      hideOnMobile: true,
    },
    { mode: "bottom", label: "Предпросмотр снизу", icon: <IconBottom /> },
  ];

  return (
    <div>
      {diagramInserter}
      {formulaInserter}

      {/* Layout toolbar */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground mr-1">
          Предпросмотр:
        </span>
        {layoutButtons.map(({ mode, label, icon, hideOnMobile }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayout(mode)}
            aria-pressed={layout === mode}
            aria-label={label}
            title={label}
            className={`p-1.5 rounded border transition-colors ${hideOnMobile ? "hidden sm:inline-flex" : "inline-flex"} items-center justify-center ${
              layout === mode
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Split layout */}
      {layout === "none" ? (
        <div>{children}</div>
      ) : (
        <div
          ref={containerRef}
          className={gridClassName}
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
