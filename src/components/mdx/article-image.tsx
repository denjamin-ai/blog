"use client";

import { useState, useEffect, useCallback } from "react";

interface ArticleImageProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function ArticleImage({ src, alt, caption, width, height }: ArticleImageProps) {
  const hasCustomSize = width !== undefined || height !== undefined;
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <>
      <figure className="my-6">
        <img
          src={src}
          alt={alt}
          onClick={() => setIsOpen(true)}
          className={`${hasCustomSize ? "" : "w-full "}rounded-xl border border-border/50 shadow-sm cursor-zoom-in transition-opacity motion-safe:hover:opacity-90`}
          style={hasCustomSize ? {
            maxWidth: width ? `${width}px` : undefined,
            maxHeight: height ? `${height}px` : undefined,
          } : undefined}
        />
        {caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none"
            onClick={close}
            aria-label="Закрыть"
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl animate-dialog-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
