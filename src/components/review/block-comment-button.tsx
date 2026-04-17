"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useReviewContext } from "./review-context";
import type { AnchorData } from "@/types";

const BLOCK_SELECTORS = [
  "pre[data-anchor-id]",
  ".katex-display[data-anchor-id]",
  ".katex[data-anchor-id]",
  "figure[data-anchor-id]",
  ".mermaid-container[data-anchor-id]",
].join(", ");

interface ButtonPosition {
  top: number;
  left: number;
}

export function BlockCommentButton() {
  const {
    permissions,
    assignmentStatus,
    articleRef,
    setPendingAnchor,
  } = useReviewContext();

  const [position, setPosition] = useState<ButtonPosition | null>(null);
  const [hoveredAnchorId, setHoveredAnchorId] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canShow =
    permissions.canComment &&
    (assignmentStatus === "pending" || assignmentStatus === "accepted");

  const showButton = useCallback(
    (el: HTMLElement) => {
      clearTimeout(hideTimer.current);
      const anchorId = el.getAttribute("data-anchor-id");
      if (!anchorId) return;

      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + 4,
        left: rect.left - 36,
      });
      setHoveredAnchorId(anchorId);
    },
    [],
  );

  const hideButton = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setPosition(null);
      setHoveredAnchorId(null);
    }, 200);
  }, []);

  // Attach event listeners to block elements
  useEffect(() => {
    if (!canShow) return;
    const container = articleRef.current;
    if (!container) return;

    const blocks = container.querySelectorAll(BLOCK_SELECTORS);

    const enterHandlers = new Map<Element, () => void>();
    const leaveHandlers = new Map<Element, () => void>();

    blocks.forEach((block) => {
      const el = block as HTMLElement;
      const enter = () => showButton(el);
      const leave = () => hideButton();
      enterHandlers.set(el, enter);
      leaveHandlers.set(el, leave);
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      blocks.forEach((block) => {
        const el = block as HTMLElement;
        const enter = enterHandlers.get(el);
        const leave = leaveHandlers.get(el);
        if (enter) el.removeEventListener("mouseenter", enter);
        if (leave) el.removeEventListener("mouseleave", leave);
      });
    };
  }, [canShow, articleRef, showButton, hideButton]);

  const handleClick = useCallback(() => {
    if (!hoveredAnchorId) return;

    const anchorData: AnchorData = {
      anchorType: "block",
      anchorId: hoveredAnchorId,
      selectors: [],
    };

    setPendingAnchor({
      anchorData,
      quotedText: "",
      mode: "comment",
    });

    setPosition(null);
    setHoveredAnchorId(null);
  }, [hoveredAnchorId, setPendingAnchor]);

  if (!mounted || !position || !canShow) return null;

  return createPortal(
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={hideButton}
      aria-label="Комментировать блок"
      className="fixed z-[55] w-7 h-7 flex items-center justify-center rounded-full bg-elevated shadow-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all motion-safe:animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>,
    document.body,
  );
}
