import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalResult] = await db.select({ count: count() }).from(articles);
  const [publishedResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "published"));
  const [draftResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "draft"));

  const stats = [
    { label: "Всего статей", value: totalResult.count, href: "/admin/articles" },
    { label: "Опубликовано", value: publishedResult.count, href: "/admin/articles" },
    { label: "Черновики", value: draftResult.count, href: "/admin/articles" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Новая статья
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
