import { NextResponse } from "next/server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { getSession } from "@/lib/auth";

// Converts <Mermaid chart={...}>, <Diagram type="..." chart={...}>, <Circuit code={...}>
// MDX JSX nodes into plain HTML nodes before remarkRehype runs.
// This makes Mermaid diagrams renderable client-side in the preview pane.
function remarkMdxDiagramsToHtml() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(
      tree,
      "mdxJsxFlowElement",
      (node: any, index: number | undefined, parent: any) => {
        if (!parent || index == null) return;
        const name: string = node.name;
        if (
          ![
            "Mermaid",
            "Diagram",
            "Circuit",
            "ArticleImage",
            "ArticleVideo",
          ].includes(name)
        )
          return;

        function getAttr(attrName: string): string {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const attr = node.attributes?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any) => a.type === "mdxJsxAttribute" && a.name === attrName,
          );
          if (!attr) return "";
          const val = attr.value;
          if (typeof val === "string") return val;
          if (val?.type === "mdxJsxAttributeValueExpression") {
            const raw: string = val.value.trim();
            // Template literal: `...`
            if (raw.startsWith("`") && raw.endsWith("`"))
              return raw
                .slice(1, -1)
                .replace(/\\`/g, "`")
                .replace(/\\\\/g, "\\");
            // Double-quoted string
            if (raw.startsWith('"') && raw.endsWith('"'))
              try {
                return JSON.parse(raw);
              } catch {
                return raw.slice(1, -1);
              }
            // Single-quoted string
            if (raw.startsWith("'") && raw.endsWith("'"))
              return raw.slice(1, -1).replace(/\\'/g, "'");
            return raw;
          }
          return "";
        }

        function escape(s: string): string {
          return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function escapeAttr(s: string): string {
          return s
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        }

        let html = "";
        if (name === "Mermaid") {
          const chart = getAttr("chart");
          html = `<pre class="mermaid">${escape(chart)}</pre>`;
        } else if (name === "Diagram") {
          const type = getAttr("type");
          const chart = getAttr("chart");
          html = `<pre class="language-${type}-diagram">${escape(chart)}</pre>`;
        } else if (name === "Circuit") {
          const code = getAttr("code");
          html = `<pre class="language-tikz-diagram">${escape(code)}</pre>`;
        } else if (name === "ArticleImage") {
          const src = getAttr("src");
          const alt = getAttr("alt");
          const caption = getAttr("caption");
          const captionHtml = caption
            ? `<figcaption style="text-align:center;font-size:0.875rem;color:var(--color-muted-foreground);font-style:italic;margin-top:0.5rem">${escape(caption)}</figcaption>`
            : "";
          html = `<figure style="margin:1.5rem 0"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="width:100%;border-radius:0.75rem;border:1px solid var(--color-border)" />${captionHtml}</figure>`;
        } else if (name === "ArticleVideo") {
          const src = getAttr("src");
          const poster = getAttr("poster");
          const posterAttr = poster ? ` poster="${escapeAttr(poster)}"` : "";
          html = `<div style="margin:1.5rem 0;border-radius:0.75rem;overflow:hidden;border:1px solid var(--color-border)"><video src="${escapeAttr(src)}"${posterAttr} controls preload="metadata" style="width:100%;display:block"></video></div>`;
        }

        if (html) {
          parent.children.splice(index, 1, { type: "html", value: html });
        }
      },
    );
  };
}

// Module-level processor — Shiki initializes once on first call
const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkMath)
  .use(remarkMdxDiagramsToHtml)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    theme: { dark: "github-dark", light: "github-light" },
    keepBackground: false,
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAdmin && !(session.userId && session.userRole === "author")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let content: string;
  try {
    const body = await request.json();
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }

  if (content.length > 100_000) {
    return NextResponse.json({ error: "content too large" }, { status: 400 });
  }

  try {
    const file = await processor.process(content);
    return NextResponse.json({ html: String(file) });
  } catch {
    return NextResponse.json({
      html: '<p class="text-danger text-sm">Ошибка компиляции MDX</p>',
    });
  }
}
