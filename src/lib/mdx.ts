import { compileMDX as compile } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import { Expandable } from "@/components/mdx/expandable";

const mdxComponents = {
  Expandable,
};

export async function compileMDX(source: string) {
  try {
    const { content } = await compile({
      source,
      components: mdxComponents,
      options: {
        mdxOptions: {
          rehypePlugins: [
            [
              rehypeSanitize,
              {
                ...defaultSchema,
                attributes: {
                  ...defaultSchema.attributes,
                  code: [
                    ...(defaultSchema.attributes?.code ?? []),
                    "className",
                  ],
                },
              },
            ],
            rehypeSlug,
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
