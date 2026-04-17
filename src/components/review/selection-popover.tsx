"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createAnchor } from "@/lib/anchoring";
import { useReviewContext } from "./review-context";

interface PopoverPosition {
  top: number;
  left: number;
}

/**
 * Check if a node is inside an SVG element (e.g. Mermaid diagram).
 */
function isInsideSvg(node: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (current instanceof SVGElement) return true;
    current = current.parentNode;
  }
  return false;
}

/**
 * Check if selection spans across different data-anchor-id elements
 * (i.e. crosses MDX component boundaries).
 */
function crossesAnchorBoundary(range: Range, container: HTMLElement): boolean {
  const startAnchor = findClosestAnchorId(range.startContainer, container);
  const endAnchor = findClosestAnchorId(range.endContainer, container);

  // If both are null (general text), that's fine
  if (startAnchor === null && endAnchor === null) return false;
  // If one is null and other isn't, or they differ
  return startAnchor !== endAnchor;
}

function findClosestAnchorId(
  node: Node,
  boundary: HTMLElement,
): string | null {
  let current: Node | null = node;
  while (current && current !== boundary) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-anchor-id")
    ) {
      return current.getAttribute("data-anchor-id");
    }
    current = current.parentNode;
  }
  return null;
}

export function SelectionPopover() {
  const {
    permissions,
    assignmentStatus,
    articleRef,
    setPendingAnchor,
  } = useReviewContext();

  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [currentRange, setCurrentRange] = useState<Range | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canShow =
    permissions.canComment &&
    (assignmentStatus === "pending" || assignmentStatus === "accepted");

  const hidePopover = useCallback(() => {
    setPosition(null);
    setCurrentRange(null);
  }, []);

  // Listen for selection changes
  useEffect(() => {
    if (!canShow) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const onSelectionChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? "";
        const container = articleRef.current;

        if (
          !text ||
          !sel ||
          !container ||
          !container.contains(sel.anchorNode)
        ) {
          hidePopover();
          return;
        }

        const range = sel.getRangeAt(0);

        // Skip if inside SVG
        if (isInsideSvg(range.startContainer) || isInsideSvg(range.endContainer)) {
          hidePopover();
          return;
        }

        // Skip if crosses anchor boundaries
        if (crossesAnchorBoundary(range, container)) {
          hidePopover();
          return;
        }

        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.top - 48,
          left: rect.left + rect.width / 2,
        });
        setCurrentRange(range.cloneRange());
      }, 100);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      clearTimeout(debounceTimer);
    };
  }, [canShow, articleRef, hidePopover]);

  // Hide on Escape
  useEffect(() => {
    if (!position) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hidePopover();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [position, hidePopover]);

  // Hide on click outside
  useEffect(() => {
    if (!position) return;

    const onClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        // Small delay to let selection-based logic run first
        setTimeout(hidePopover, 50);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [position, hidePopover]);

  const handleAction = useCallback(
    (mode: "comment" | "suggestion") => {
      if (!currentRange || !articleRef.current) return;

      const anchorData = createAnchor(currentRange, articleRef.current);
      const quotedText = currentRange.toString();

      setPendingAnchor({ anchorData, quotedText, mode });
      window.getSelection()?.removeAllRanges();
      hidePopover();
    },
    [currentRange, articleRef, setPendingAnchor, hidePopover],
  );

  if (!mounted || !position || !canShow) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="toolbar"
      aria-label="Действия с выделенным текстом"
      className="fixed z-[60] flex items-center gap-1 bg-elevated rounded-lg shadow-md border border-border p-1 motion-safe:animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onClick={() => handleAction("comment")}
        className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors whitespace-nowrap"
      >
        Комментировать
      </button>
      {permissions.canSuggest && (
        <button
          onClick={() => handleAction("suggestion")}
          className="px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors whitespace-nowrap"
        >
          Предложить правку
        </button>
      )}
    </div>,
    document.body,
  );
}
