"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { resolveAnchor } from "@/lib/anchoring";
import { useReviewContext, type ReviewComment } from "./review-context";
import type { AnchorData } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseAnchorData(comment: ReviewComment): AnchorData | null {
  if (!comment.anchorData) return null;
  try {
    return JSON.parse(comment.anchorData) as AnchorData;
  } catch {
    return null;
  }
}

/** Feature-detect the CSS Custom Highlight API */
function supportsHighlightAPI(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS;
}

/**
 * Inject ::highlight() CSS via a <style> tag (Turbopack can't parse these).
 * Called once on mount.
 */
const HIGHLIGHT_STYLE_ID = "review-highlight-styles";
function ensureHighlightStyles() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    ::highlight(review-open) { background-color: rgb(250 204 21 / 0.3); }
    ::highlight(review-resolved) { background-color: rgb(156 163 175 / 0.2); }
    ::highlight(review-active) { background-color: rgb(250 204 21 / 0.5); }
    .dark ::highlight(review-open) { background-color: rgb(250 204 21 / 0.2); }
    .dark ::highlight(review-resolved) { background-color: rgb(156 163 175 / 0.15); }
    .dark ::highlight(review-active) { background-color: rgb(250 204 21 / 0.35); }
  `;
  document.head.appendChild(style);
}

/**
 * Find which comment a click falls within using caret positioning APIs.
 */
function findClickedCommentId(
  x: number,
  y: number,
  rangeMap: Map<string, Range>,
): string | null {
  // Try caretPositionFromPoint (standard) then caretRangeFromPoint (WebKit)
  let caretOffset: { node: Node; offset: number } | null = null;

  if ("caretPositionFromPoint" in document) {
    const pos = (
      document as unknown as {
        caretPositionFromPoint(
          x: number,
          y: number,
        ): { offsetNode: Node; offset: number } | null;
      }
    ).caretPositionFromPoint(x, y);
    if (pos) caretOffset = { node: pos.offsetNode, offset: pos.offset };
  } else if ("caretRangeFromPoint" in document) {
    const range = (document as Document & { caretRangeFromPoint(x: number, y: number): Range | null }).caretRangeFromPoint(x, y);
    if (range)
      caretOffset = { node: range.startContainer, offset: range.startOffset };
  }

  if (!caretOffset) return null;

  for (const [commentId, range] of rangeMap) {
    if (rangeContainsPoint(range, caretOffset.node, caretOffset.offset)) {
      return commentId;
    }
  }
  return null;
}

function rangeContainsPoint(
  range: Range,
  node: Node,
  offset: number,
): boolean {
  try {
    const testRange = document.createRange();
    testRange.setStart(node, offset);
    testRange.setEnd(node, offset);
    return (
      range.compareBoundaryPoints(Range.START_TO_START, testRange) <= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, testRange) >= 0
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HighlightLayer() {
  const {
    comments,
    activeThreadId,
    setActiveThreadId,
    articleRef,
    setOrphanIds,
    scrollingFromRef,
  } = useReviewContext();

  // Map commentId → resolved Range (for click detection)
  const rangeMapRef = useRef<Map<string, Range>>(new Map());
  // Track fallback marks
  const fallbackContainerRef = useRef<HTMLDivElement | null>(null);

  // Defer highlight API check to client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const useNativeHighlight = mounted && supportsHighlightAPI();

  // ---------------------------------------------------------------------------
  // Resolve anchors and update highlights
  // ---------------------------------------------------------------------------
  const updateHighlights = useCallback(() => {
    const container = articleRef.current;
    if (!container) return;

    const newRangeMap = new Map<string, Range>();
    const newOrphans = new Set<string>();

    // Only process root comments with anchor data
    const anchored = comments.filter(
      (c) => c.parentId === null && c.anchorData,
    );

    for (const comment of anchored) {
      const anchor = parseAnchorData(comment);
      if (!anchor) {
        newOrphans.add(comment.id);
        continue;
      }
      const range = resolveAnchor(anchor, container);
      if (range) {
        newRangeMap.set(comment.id, range);
      } else {
        newOrphans.add(comment.id);
      }
    }

    rangeMapRef.current = newRangeMap;
    setOrphanIds(newOrphans);

    if (useNativeHighlight) {
      applyNativeHighlights(newRangeMap, activeThreadId, comments);
    }
  }, [comments, activeThreadId, articleRef, setOrphanIds, useNativeHighlight]);

  useEffect(() => {
    // Small delay to let MDX content hydrate
    const timer = setTimeout(updateHighlights, 100);
    return () => clearTimeout(timer);
  }, [updateHighlights]);

  // Inject ::highlight() CSS and cleanup on unmount
  useEffect(() => {
    if (supportsHighlightAPI()) {
      ensureHighlightStyles();
    }
    return () => {
      if (supportsHighlightAPI()) {
        CSS.highlights.delete("review-open");
        CSS.highlights.delete("review-resolved");
        CSS.highlights.delete("review-active");
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Click handler
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const commentId = findClickedCommentId(
        e.clientX,
        e.clientY,
        rangeMapRef.current,
      );
      if (commentId) {
        scrollingFromRef.current = "highlight";
        setActiveThreadId(commentId);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [articleRef, setActiveThreadId, scrollingFromRef]);

  // ---------------------------------------------------------------------------
  // Fallback rendering (no CSS Highlight API)
  // ---------------------------------------------------------------------------
  if (!mounted || useNativeHighlight) {
    // Not yet mounted or native API available — no DOM output needed
    return null;
  }

  return <FallbackMarks rangeMapRef={rangeMapRef} containerRef={fallbackContainerRef} />;
}

// ---------------------------------------------------------------------------
// Native Highlight API
// ---------------------------------------------------------------------------

function applyNativeHighlights(
  rangeMap: Map<string, Range>,
  activeThreadId: string | null,
  comments: ReviewComment[],
) {
  const openRanges: Range[] = [];
  const resolvedRanges: Range[] = [];
  const activeRanges: Range[] = [];

  const commentMap = new Map(comments.map((c) => [c.id, c]));

  for (const [commentId, range] of rangeMap) {
    if (commentId === activeThreadId) {
      activeRanges.push(range);
      continue;
    }
    const comment = commentMap.get(commentId);
    if (!comment) continue; // skip unknown comments
    if (comment.resolvedAt !== null) {
      resolvedRanges.push(range);
    } else {
      openRanges.push(range);
    }
  }

  try {
    if (openRanges.length > 0) {
      CSS.highlights.set("review-open", new Highlight(...openRanges));
    } else {
      CSS.highlights.delete("review-open");
    }

    if (resolvedRanges.length > 0) {
      CSS.highlights.set("review-resolved", new Highlight(...resolvedRanges));
    } else {
      CSS.highlights.delete("review-resolved");
    }

    if (activeRanges.length > 0) {
      CSS.highlights.set("review-active", new Highlight(...activeRanges));
    } else {
      CSS.highlights.delete("review-active");
    }
  } catch {
    // Range may be detached; ignore
  }
}

// ---------------------------------------------------------------------------
// Fallback: <mark> overlay
// ---------------------------------------------------------------------------

function FallbackMarks({
  rangeMapRef,
  containerRef,
}: {
  rangeMapRef: React.RefObject<Map<string, Range>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { comments, activeThreadId, setActiveThreadId, articleRef, scrollingFromRef } =
    useReviewContext();

  const commentMap = new Map(comments.map((c) => [c.id, c]));

  // Build mark rects
  const marks: Array<{
    commentId: string;
    rect: DOMRect;
    status: "open" | "resolved" | "active";
  }> = [];

  const articleEl = articleRef.current;
  if (articleEl) {
    const articleRect = articleEl.getBoundingClientRect();
    for (const [commentId, range] of rangeMapRef.current) {
      const comment = commentMap.get(commentId);
      if (!comment) continue;
      const status: "open" | "resolved" | "active" =
        commentId === activeThreadId
          ? "active"
          : comment.resolvedAt !== null
            ? "resolved"
            : "open";
      const rects = range.getClientRects();
      for (const rect of rects) {
        marks.push({
          commentId,
          rect: new DOMRect(
            rect.left - articleRect.left,
            rect.top - articleRect.top,
            rect.width,
            rect.height,
          ),
          status,
        });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {marks.map((m, i) => (
        <mark
          key={`${m.commentId}-${i}`}
          data-review-highlight={m.status}
          role="mark"
          aria-label="Комментарий к тексту"
          className={`pointer-events-auto absolute ${
            m.commentId === activeThreadId ? "review-highlight-pulse" : ""
          }`}
          style={{
            left: m.rect.left,
            top: m.rect.top,
            width: m.rect.width,
            height: m.rect.height,
          }}
          onClick={() => {
            scrollingFromRef.current = "highlight";
            setActiveThreadId(m.commentId);
          }}
        />
      ))}
    </div>
  );
}
