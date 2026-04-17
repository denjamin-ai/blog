"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveAnchor } from "@/lib/anchoring";
import { useReviewContext } from "./review-context";
import type { AnchorData } from "@/types";

const MIN_GAP = 28;

interface PinData {
  commentId: string;
  pinNumber: number;
  top: number;
  isResolved: boolean;
}

function parseAnchorData(json: string | null): AnchorData | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AnchorData;
  } catch {
    return null;
  }
}

export function MarginPins() {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    articleRef,
    orphanIds,
    scrollingFromRef,
  } = useReviewContext();

  const [pins, setPins] = useState<PinData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePins = useCallback(() => {
    const container = articleRef.current;
    if (!container) return;

    const rawPins: PinData[] = [];

    threads.forEach((thread, idx) => {
      if (orphanIds.has(thread.root.id)) return;
      if (!thread.root.anchorData) return;

      const anchor = parseAnchorData(thread.root.anchorData);
      if (!anchor) return;

      const range = resolveAnchor(anchor, container);
      if (!range) return;

      const rects = range.getClientRects();
      if (rects.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const top = rects[0].top - containerRect.top;

      rawPins.push({
        commentId: thread.root.id,
        pinNumber: idx + 1,
        top,
        isResolved: thread.root.resolvedAt !== null,
      });
    });

    // Sort by top position
    rawPins.sort((a, b) => a.top - b.top);

    // Stack overlapping pins
    for (let i = 1; i < rawPins.length; i++) {
      const prev = rawPins[i - 1];
      if (rawPins[i].top - prev.top < MIN_GAP) {
        rawPins[i].top = prev.top + MIN_GAP;
      }
    }

    setPins(rawPins);
  }, [threads, articleRef, orphanIds]);

  // Recalculate on mount + content changes
  useEffect(() => {
    const timer = setTimeout(calculatePins, 150);
    return () => clearTimeout(timer);
  }, [calculatePins]);

  // Recalculate on resize
  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      calculatePins();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [articleRef, calculatePins]);

  if (pins.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-0 w-8 hidden lg:block"
      style={{ transform: "translateX(100%)" }}
      aria-label="Замечания к тексту"
    >
      {pins.map((pin) => {
        const isActive = activeThreadId === pin.commentId;
        return (
          <button
            key={pin.commentId}
            role="button"
            aria-label={`Замечание ${pin.pinNumber}`}
            className={`absolute w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
              isActive
                ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background scale-110"
                : pin.isResolved
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-accent text-accent-foreground hover:opacity-90"
            }`}
            style={{ top: pin.top, right: 0 }}
            onClick={() => {
              scrollingFromRef.current = "pin";
              setActiveThreadId(pin.commentId);
            }}
          >
            {pin.pinNumber}
          </button>
        );
      })}
    </div>
  );
}
