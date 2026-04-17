import { visit } from "unist-util-visit";
import { createHash } from "node:crypto";
import type { Root, Element, Text } from "hast";

const ANCHOR_TAGS = new Set([
  "p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "td", "th",
]);

function extractText(node: Element): string {
  let text = "";
  for (const child of node.children ?? []) {
    if (child.type === "text") text += (child as Text).value;
    else if (child.type === "element") text += extractText(child as Element);
  }
  return text;
}

function computeAnchorId(treePath: string, textSnippet: string): string {
  const hash = createHash("sha256");
  hash.update(treePath + "|" + textSnippet.slice(0, 32));
  return hash.digest("hex").slice(0, 12);
}

export function rehypeAnchorIds() {
  return (tree: Root) => {
    const counters: Record<string, number> = {};

    visit(tree, "element", (node: Element) => {
      const tag = node.tagName;

      // Text blocks: p, li, headings, blockquote, table cells
      if (ANCHOR_TAGS.has(tag)) {
        const key = tag;
        counters[key] = (counters[key] || 0) + 1;
        const treePath = `${key}:${counters[key]}`;
        const text = extractText(node);
        node.properties = node.properties || {};
        node.properties["dataAnchorId"] = computeAnchorId(treePath, text);
        return;
      }

      // Code blocks: <pre>
      if (tag === "pre") {
        const key = "pre";
        counters[key] = (counters[key] || 0) + 1;
        const treePath = `${key}:${counters[key]}`;
        const text = extractText(node);
        node.properties = node.properties || {};
        node.properties["dataAnchorId"] = computeAnchorId(treePath, text);
        return;
      }

      // KaTeX containers: <span class="katex-display"> or <span class="katex">
      if (tag === "span") {
        const classes = node.properties?.className;
        const classList = Array.isArray(classes) ? classes : [];
        if (
          classList.includes("katex-display") ||
          classList.includes("katex")
        ) {
          const key = "katex";
          counters[key] = (counters[key] || 0) + 1;
          const treePath = `${key}:${counters[key]}`;
          node.properties = node.properties || {};
          node.properties["dataAnchorId"] = computeAnchorId(
            treePath,
            extractText(node),
          );
        }
      }
    });
  };
}
