import { compileMDX as compile } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import { rehypeAnchorIds } from "@/lib/rehype-anchor-ids";
import { Expandable } from "@/components/mdx/expandable";
import { ArticleImage } from "@/components/mdx/article-image";
import { ArticleVideo } from "@/components/mdx/article-video";
import { Mermaid } from "@/components/mdx/mermaid";
import { Diagram } from "@/components/mdx/diagram";
import { Circuit } from "@/components/mdx/circuit";
import {
  ReviewMermaid,
  ReviewDiagram,
  ReviewCircuit,
} from "@/components/mdx/diagram-with-source";

const mdxComponents = {
  Expandable,
  ArticleImage,
  ArticleVideo,
  Mermaid,
  Diagram,
  Circuit,
};

const mdxReviewComponents = {
  Expandable,
  ArticleImage,
  ArticleVideo,
  Mermaid: ReviewMermaid,
  Diagram: ReviewDiagram,
  Circuit: ReviewCircuit,
};

// Удаляет потенциально опасные HTML-элементы и атрибуты из исходного MDX до компиляции.
// Защита от XSS: теги, event handlers, javascript: URI.
export function stripDangerousHtml(source: string): string {
  return source
    .replace(/<(script|iframe|object|embed|link)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|link)\b[^>]*\/?>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "")
    .replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "");
}

export async function compileMDX(
  source: string,
  options: { reviewMode?: boolean } = {},
) {
  const components = options.reviewMode ? mdxReviewComponents : mdxComponents;
  try {
    const { content } = await compile({
      source: stripDangerousHtml(source),
      components,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [
            rehypeSlug,
            rehypeKatex,
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light",
                },
                keepBackground: false,
              },
            ],
            rehypeAnchorIds,
          ],
        },
      },
    });

    return content;
  } catch (err) {
    console.error("MDX compilation failed:", err);
    throw new Error("Failed to compile article content");
  }
}
