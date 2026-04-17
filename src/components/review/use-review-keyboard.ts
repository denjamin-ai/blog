"use client";

import { useEffect, useCallback } from "react";
import { resolveAnchor, createAnchor } from "@/lib/anchoring";
import { useReviewContext } from "./review-context";
import type { AnchorData } from "@/types";

function parseAnchorData(json: string | null): AnchorData | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AnchorData;
  } catch {
    return null;
  }
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea" || tag === "input") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useReviewKeyboard() {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    articleRef,
    assignmentStatus,
    permissions,
    refreshComments,
    setPendingAnchor,
    scrollingFromRef,
  } = useReviewContext();

  // Find unresolved thread indices
  const getUnresolvedIndices = useCallback(() => {
    return threads
      .map((t, i) => ({ thread: t, index: i }))
      .filter((x) => x.thread.root.resolvedAt === null);
  }, [threads]);

  // Scroll article to a thread's anchor
  const scrollToThreadAnchor = useCallback(
    (threadId: string) => {
      const container = articleRef.current;
      if (!container) return;

      const thread = threads.find((t) => t.root.id === threadId);
      if (!thread) return;

      const anchor = parseAnchorData(thread.root.anchorData);
      if (!anchor) return;

      const range = resolveAnchor(anchor, container);
      if (!range) return;

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollParent =
        container.closest(".overflow-y-auto") ?? container.parentElement;
      if (scrollParent) {
        scrollParent.scrollTo({
          top: scrollParent.scrollTop + rect.top - containerRect.top - 100,
          behavior: "smooth",
        });
      }
    },
    [articleRef, threads],
  );

  // Scroll sidebar to thread
  const scrollSidebarToThread = useCallback((threadId: string) => {
    const el = document.querySelector(`[data-thread-id="${CSS.escape(threadId)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isModEnter =
        (e.metaKey || e.ctrlKey) && e.key === "Enter";

      // Cmd+Enter always works (even in inputs) — submit focused form
      if (isModEnter) {
        const focused = document.activeElement;
        const form = focused?.closest("form");
        if (form) {
          e.preventDefault();
          form.requestSubmit();
        }
        return;
      }

      // All other shortcuts disabled when input is focused
      if (isInputFocused()) return;

      // Don't interfere when assignment is not active
      if (assignmentStatus !== "accepted") return;

      switch (e.key.toLowerCase()) {
        case "n":
        case "p": {
          e.preventDefault();
          const unresolved = getUnresolvedIndices();
          if (unresolved.length === 0) return;

          const currentIdx = activeThreadId
            ? unresolved.findIndex((x) => x.thread.root.id === activeThreadId)
            : -1;

          let nextIdx: number;
          if (e.key.toLowerCase() === "n") {
            nextIdx =
              currentIdx === -1 ? 0 : (currentIdx + 1) % unresolved.length;
          } else {
            nextIdx =
              currentIdx <= 0
                ? unresolved.length - 1
                : currentIdx - 1;
          }

          const nextThread = unresolved[nextIdx].thread;
          scrollingFromRef.current = "keyboard";
          setActiveThreadId(nextThread.root.id);
          scrollToThreadAnchor(nextThread.root.id);
          scrollSidebarToThread(nextThread.root.id);
          break;
        }

        case "r": {
          if (!activeThreadId) return;
          e.preventDefault();
          if (!permissions.canResolve) return;
          const thread = threads.find((t) => t.root.id === activeThreadId);
          if (!thread || thread.root.resolvedAt !== null) return;

          fetch(`/api/review-comments/${activeThreadId}/resolve`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolved: true }),
          })
            .then((res) => {
              if (res.ok) refreshComments();
            })
            .catch(() => {
              // network error — silent, user can retry
            });
          break;
        }

        case "e": {
          if (!activeThreadId) return;
          e.preventDefault();
          const threadEl = document.querySelector(
            `[data-thread-id="${activeThreadId}"]`,
          );
          const input = threadEl?.querySelector<HTMLInputElement>(
            'input[type="text"]',
          );
          if (input) input.focus();
          break;
        }

        case "c": {
          if (!permissions.canComment) return;
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) return;

          const container = articleRef.current;
          if (!container) return;

          // Check selection is inside article
          const range = sel.getRangeAt(0);
          if (!container.contains(range.commonAncestorContainer)) return;

          e.preventDefault();
          try {
            const anchorData = createAnchor(range, container);
            const exact = anchorData.selectors.find(
              (s) => s.type === "TextQuoteSelector",
            );
            setPendingAnchor({
              anchorData,
              quotedText:
                exact && "exact" in exact ? exact.exact : sel.toString(),
              mode: "comment",
            });
          } catch {
            // ignore anchor creation errors
          }
          break;
        }
      }
    },
    [
      activeThreadId,
      assignmentStatus,
      getUnresolvedIndices,
      permissions,
      threads,
      articleRef,
      scrollToThreadAnchor,
      scrollSidebarToThread,
      setActiveThreadId,
      refreshComments,
      setPendingAnchor,
      scrollingFromRef,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
