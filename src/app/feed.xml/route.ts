import { db } from "@/lib/db";
import { articles, users, profile } from "@/lib/db/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";
import { parseTags, mdxToPlainText } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://localhost:3000";

  const [profileData, publishedArticles] = await Promise.all([
    db
      .select({ name: profile.name, bio: profile.bio })
      .from(profile)
      .where(eq(profile.id, "main"))
      .get(),
    db
      .select({
        slug: articles.slug,
        title: articles.title,
        excerpt: articles.excerpt,
        content: articles.content,
        tags: articles.tags,
        publishedAt: articles.publishedAt,
        authorName: users.name,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        and(
          eq(articles.status, "published"),
          or(isNull(articles.authorId), eq(users.isBlocked, 0)),
        ),
      )
      .orderBy(desc(articles.publishedAt)),
  ]);

  const channelTitle = escapeXml(profileData?.name || "devblog");
  const channelDescription = escapeXml(
    profileData?.bio ||
      "Персональный блог разработчика — статьи о программировании, веб-разработке и технологиях.",
  );
  const buildDate = new Date().toUTCString();

  const items = publishedArticles
    .map((article) => {
      const link = `${baseUrl}/blog/${article.slug}`;
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt * 1000).toUTCString()
        : buildDate;
      const description = escapeXml(
        article.excerpt?.trim()
          ? article.excerpt.slice(0, 500)
          : mdxToPlainText(article.content, 500),
      );
      const tags = parseTags(article.tags);
      const categories = tags
        .map((t) => `    <category>${escapeXml(t)}</category>`)
        .join("\n");
      // RSS 2.0 <author> требует email; используем dc:creator для имени автора
      const creator = article.authorName
        ? `    <dc:creator>${escapeXml(article.authorName)}</dc:creator>`
        : "";

      return `  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>${creator ? `\n${creator}` : ""}${categories ? `\n${categories}` : ""}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${channelTitle}</title>
    <link>${baseUrl}/blog</link>
    <description>${channelDescription}</description>
    <language>ru</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
