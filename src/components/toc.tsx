"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TocEntry {
  level: number;
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0400-\u04FF-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

function parseHeadings(content: string): TocEntry[] {
  const lines = content.split("\n");
  const entries: TocEntry[] = [];
  const slugCounts: Record<string, number> = {};
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let slug = slugify(text);
      if (slugCounts[slug] !== undefined) {
        slugCounts[slug]++;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 0;
      }
      entries.push({ level, text, slug });
    }
  }

  return entries;
}

function indentClass(level: number) {
  if (level === 3) return "ml-3";
  if (level === 4) return "ml-6";
  return "";
}

export function TableOfContents({ content }: { content: string }) {
  const entries = useMemo(() => parseHeadings(content), [content]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (entries.length < 2) return;

    const headingEls = entries
      .map(({ slug }) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);

    if (headingEls.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (observations) => {
        const visible = observations
          .filter((o) => o.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [entries]);

  if (entries.length < 2) return null;

  const handleClick = (slug: string) => {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth" });
  };

  const list = (
    <ul className="space-y-0.5">
      {entries.map(({ level, text, slug }) => (
        <li key={slug} className={indentClass(level)}>
          <button
            onClick={() => handleClick(slug)}
            aria-controls={slug}
            className={`text-left w-full text-xs leading-relaxed py-0.5 pl-3 border-l-2 transition-[color,border-color] duration-200 ${
              activeSlug === slug
                ? "text-accent font-medium border-accent"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            }`}
          >
            {text}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        data-toc
        className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        aria-label="Оглавление"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Оглавление
        </p>
        {list}
      </nav>

      {/* Mobile collapsible */}
      <details className="lg:hidden border border-border rounded-lg">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
          Оглавление
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    </>
  );
}
