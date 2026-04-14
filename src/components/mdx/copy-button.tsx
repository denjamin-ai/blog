"use client";

import { useEffect } from "react";

const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

export function CodeCopyButtons() {
  useEffect(() => {
    const buttons: HTMLButtonElement[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const figures = document.querySelectorAll(
      "[data-rehype-pretty-code-figure]",
    );

    figures.forEach((figure) => {
      if (figure.querySelector(".copy-button")) return;

      const pre = figure.querySelector("pre");
      const code = pre?.querySelector("code");
      if (!pre || !code) return;

      const button = document.createElement("button");
      button.className = "copy-button";
      button.setAttribute("aria-label", "Копировать код");
      button.innerHTML = COPY_ICON;

      button.addEventListener("click", async () => {
        const text = code.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          try {
            textarea.select();
            document.execCommand("copy");
          } finally {
            document.body.removeChild(textarea);
          }
        }
        button.innerHTML = CHECK_ICON;
        button.classList.add("copied");
        const timeout = setTimeout(() => {
          button.innerHTML = COPY_ICON;
          button.classList.remove("copied");
        }, 2000);
        timeouts.push(timeout);
      });

      pre.appendChild(button);
      buttons.push(button);
    });

    return () => {
      timeouts.forEach(clearTimeout);
      buttons.forEach((btn) => btn.remove());
    };
  }, []);

  return null;
}
