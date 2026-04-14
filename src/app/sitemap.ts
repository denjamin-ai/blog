import { db } from "@/lib/db";
import { articles, users } from "@/lib/db/schema";
import { eq, and, or, isNull, isNotNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://localhost:3000";

  const [publishedArticles, authors] = await Promise.all([
    db
      .select({
        slug: articles.slug,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        and(
          eq(articles.status, "published"),
          or(isNull(articles.authorId), eq(users.isBlocked, 0)),
        ),
      ),
    db
      .select({ slug: users.slug, updatedAt: users.updatedAt })
      .from(users)
      .where(
        and(
          eq(users.role, "author"),
          eq(users.isBlocked, 0),
          isNotNull(users.slug),
        ),
      ),
  ]);

  const articleRoutes: MetadataRoute.Sitemap = publishedArticles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: new Date(a.updatedAt * 1000),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${baseUrl}/authors/${a.slug!}`,
    lastModified: new Date(a.updatedAt * 1000),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...articleRoutes,
    ...authorRoutes,
  ];
}
