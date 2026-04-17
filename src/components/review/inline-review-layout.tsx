"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReviewContext } from "./review-context";
import { HighlightLayer } from "./highlight-layer";
import { SelectionPopover } from "./selection-popover";
import { BlockCommentButton } from "./block-comment-button";
import { MarginPins } from "./margin-pins";
import { ReviewSidebar } from "./review-sidebar";
import { DiffOverlay } from "./diff-overlay";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 380;
const STORAGE_KEY = "review-sidebar-width";

function getSavedWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (num >= MIN_SIDEBAR_WIDTH && num <= MAX_SIDEBAR_WIDTH) return num;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SIDEBAR_WIDTH;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  children: React.ReactNode;
  articleTitle: string;
  sidebarHeader?: React.ReactNode;
  sessionChat?: React.ReactNode;
  contentTabs?: React.ReactNode;
  diffEndpoint?: string;
  titleExtra?: React.ReactNode;
}

export function InlineReviewLayout({
  children,
  articleTitle,
  sidebarHeader,
  sessionChat,
  contentTabs,
  diffEndpoint,
  titleExtra,
}: Props) {
  const { articleRef, permissions } = useReviewContext();

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Load saved width on mount
  useEffect(() => {
    setSidebarWidth(getSavedWidth());
  }, []);

  // Resize handle
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarWidth],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left increases sidebar, dragging right decreases
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, startWidth.current + delta),
      );
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Save
      try {
        localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
      } catch {
        // ignore
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [sidebarWidth]);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-57px)] -mx-4 -mt-8">
      {/* Left: Article content */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        {contentTabs}

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold">{articleTitle}</h1>
            <div className="flex items-center gap-3 shrink-0">
              {titleExtra}
              <DiffOverlay diffEndpoint={diffEndpoint} />
            </div>
          </div>
          <div className="relative">
            <article
              ref={articleRef}
              id="article-content"
              className="prose dark:prose-invert max-w-3xl relative"
            >
              {children}
            </article>
            <MarginPins />
            <HighlightLayer />
          </div>
        </div>

        {/* Overlays (portaled to body) */}
        {permissions.canComment && <SelectionPopover />}
        {permissions.canComment && <BlockCommentButton />}
      </div>

      {/* Resize handle (desktop only) */}
      <div
        className="hidden lg:flex w-1.5 cursor-col-resize items-center justify-center hover:bg-accent/20 active:bg-accent/30 transition-colors shrink-0"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину панели"
      >
        <div className="w-0.5 h-8 bg-border rounded-full" />
      </div>

      {/* Right: Sidebar */}
      <aside
        className="w-full lg:w-auto min-h-[50vh] max-h-[50vh] lg:min-h-0 lg:max-h-none border-t lg:border-t-0 lg:border-l border-border bg-background shrink-0 overflow-hidden"
        style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
      >
        <div className="h-full w-full lg:w-[var(--sidebar-w)]">
          <ReviewSidebar headerSlot={sidebarHeader} sessionChat={sessionChat} />
        </div>
      </aside>
    </div>
  );
}
