"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Схема v1: { v: 1, savedAt: number, title: string, content: string, excerpt: string }
interface DraftData {
  v: 1;
  savedAt: number;
  title: string;
  content: string;
  excerpt: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function storageKey(articleId: string) {
  return `draft_${articleId}`;
}

function loadDraft(articleId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(storageKey(articleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "v" in parsed &&
      (parsed as DraftData).v === 1
    ) {
      return parsed as DraftData;
    }
    return null;
  } catch {
    return null;
  }
}

function saveDraft(articleId: string, data: Omit<DraftData, "v">): boolean {
  try {
    const entry: DraftData = { v: 1, ...data };
    localStorage.setItem(storageKey(articleId), JSON.stringify(entry));
    return true;
  } catch (e) {
    // QuotaExceededError
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      return false;
    }
    return false;
  }
}

function clearDraft(articleId: string) {
  try {
    localStorage.removeItem(storageKey(articleId));
  } catch {
    // ignore
  }
}

interface UseLocalStorageDraftOptions {
  articleId: string;
  serverUpdatedAt: number; // Unix seconds
  getFormData: () => { title: string; content: string; excerpt: string };
  onRestore: (data: {
    title: string;
    content: string;
    excerpt: string;
  }) => void;
}

export function useLocalStorageDraft({
  articleId,
  serverUpdatedAt,
  getFormData,
  onRestore,
}: UseLocalStorageDraftOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [hasStaleDraft, setHasStaleDraft] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // При маунте — проверить, есть ли более свежий черновик
  useEffect(() => {
    const draft = loadDraft(articleId);
    if (draft && draft.savedAt > serverUpdatedAt) {
      setHasStaleDraft(true);
      setShowRestoreDialog(true);
    }
  }, [articleId, serverUpdatedAt]);

  // Автосохранение каждые 30 секунд
  useEffect(() => {
    if (quotaExceeded) return;

    intervalRef.current = setInterval(() => {
      const formData = getFormData();
      setSaveStatus("saving");
      const now = Math.floor(Date.now() / 1000);
      const ok = saveDraft(articleId, { ...formData, savedAt: now });
      if (ok) {
        setSaveStatus("saved");
      } else {
        setQuotaExceeded(true);
        setSaveStatus("error");
      }
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, quotaExceeded]);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft(articleId);
    if (draft) {
      onRestoreRef.current({
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
      });
    }
    setShowRestoreDialog(false);
    setHasStaleDraft(false);
  }, [articleId]);

  const discardDraft = useCallback(() => {
    clearDraft(articleId);
    setShowRestoreDialog(false);
    setHasStaleDraft(false);
  }, [articleId]);

  const clearSavedDraft = useCallback(() => {
    clearDraft(articleId);
    setSaveStatus("idle");
  }, [articleId]);

  return {
    saveStatus,
    quotaExceeded,
    hasStaleDraft,
    showRestoreDialog,
    restoreDraft,
    discardDraft,
    clearSavedDraft,
  };
}
