---
description: "Conventions for creating and modifying MDX components"
globs: "src/components/mdx/**/*.tsx"
---

# MDX Component Conventions

## Required Pattern
- All MDX components MUST be client components (`"use client"` directive)
- Must be registered in the components map in `src/lib/mdx.ts`
- Components receive children as compiled MDX — they are React elements, not raw strings

## Cleanup
- Any `useEffect` that adds DOM elements, event listeners, or timers MUST include cleanup
- Revoke blob URLs to prevent memory leaks
- Clear timeouts/intervals on unmount

## Visual Consistency
- Code-related components MUST use the same rehype-pretty-code/Shiki pipeline for syntax highlighting
- Do NOT create standalone code renderers that bypass the MDX compilation pipeline (RunCode was removed for this reason)
- Use Tailwind classes consistent with the blog's design system

## Existing Components
- `Expandable` — collapsible content block with title, uses button + conditional render
- `CopyButton` — auto-attaches to `[data-rehype-pretty-code-figure]` blocks via useEffect

## Adding New Components
1. Create component in `src/components/mdx/`
2. Import and add to `mdxComponents` map in `src/lib/mdx.ts`
3. Add demo usage to a test article in `src/lib/db/seed.ts`
4. Verify with `npm run build`
