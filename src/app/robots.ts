import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/*", "/feed.xml"],
        disallow: ["/admin/*", "/author/*", "/reviewer/*", "/api/*", "/login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
