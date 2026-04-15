"use client";

import { useEffect, useId, useRef } from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const rawId = useId();
  // mermaid.render() requires a valid HTML id — strip colons from React's :r0: format
  const id = "mermaid-" + rawId.replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import("mermaid")
      .then((m) => {
        if (cancelled) return;
        m.default.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });
        return m.default.render(id, chart);
      })
      .then((result) => {
        if (!cancelled && result && containerRef.current) {
          containerRef.current.innerHTML = result.svg;
        }
      })
      .catch((e) => {
        if (!cancelled && containerRef.current) {
          const msg =
            e instanceof Error ? e.message : "Ошибка рендера диаграммы";
          const pre = document.createElement("pre");
          pre.className = "text-danger text-xs p-2";
          pre.textContent = msg;
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(pre);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, id]);

  return (
    <div ref={containerRef} className="mermaid my-4 overflow-auto">
      <div className="animate-pulse h-32 rounded-lg bg-muted" />
    </div>
  );
}
