import { compileMDX as compile } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import { Expandable } from "@/components/mdx/expandable";
import { ArticleImage } from "@/components/mdx/article-image";
import { ArticleVideo } from "@/components/mdx/article-video";
import { Mermaid } from "@/components/mdx/mermaid";
import { Diagram } from "@/components/mdx/diagram";
import { Circuit } from "@/components/mdx/circuit";

const mdxComponents = {
  Expandable,
  ArticleImage,
  ArticleVideo,
  Mermaid,
  Diagram,
  Circuit,
};

// Удаляет потенциально опасные HTML-элементы из исходного MDX до компиляции.
// Защита от XSS: <script>, <iframe>, <object>, <embed> выполняются браузером.
function stripDangerousHtml(source: string): string {
  return source
    .replace(/<(script|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed)\b[^>]*\/>/gi, "");
}

export async function compileMDX(source: string) {
  try {
    const { content } = await compile({
      source: stripDangerousHtml(source),
      components: mdxComponents,
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
