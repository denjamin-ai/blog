"use client";

import { useState, useEffect } from "react";

interface ShareButtonProps {
  title: string;
  slug: string;
}

export function ShareButton({ title, slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  // Проверяем доступность Clipboard API после монтирования (избегаем SSR-несоответствия)
  const [clipboardAvailable, setClipboardAvailable] = useState(true);

  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && !!navigator.clipboard,
    );
  }, []);

  function getUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return slug;
  }

  function openShare(baseUrl: string) {
    window.open(baseUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  }

  function handleTelegram() {
    const url = getUrl();
    openShare(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    );
  }

  function handleVK() {
    const url = getUrl();
    openShare(
      `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    );
  }

  function handleX() {
    const url = getUrl();
    openShare(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    );
  }

  async function handleCopy() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed silently
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs text-muted-foreground mr-1">Поделиться:</span>
      <button
        onClick={handleTelegram}
        className="share-btn"
        aria-label="Поделиться в Telegram"
      >
        Telegram
      </button>
      <button
        onClick={handleVK}
        className="share-btn"
        aria-label="Поделиться ВКонтакте"
      >
        ВКонтакте
      </button>
      <button
        onClick={handleX}
        className="share-btn"
        aria-label="Поделиться в X"
      >
        X
      </button>
      <button
        onClick={handleCopy}
        disabled={!clipboardAvailable}
        className="share-btn"
        aria-label="Копировать ссылку"
      >
        {copied ? "✓ Скопировано" : "Копировать ссылку"}
      </button>
    </div>
  );
}
