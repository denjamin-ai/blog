import { db } from "@/lib/db";
import { articleChangelog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function ArticleChangelog({ articleId }: { articleId: string }) {
  const entries = await db
    .select()
    .from(articleChangelog)
    .where(eq(articleChangelog.articleId, articleId))
    .orderBy(desc(articleChangelog.entryDate));

  if (entries.length === 0) return null;

  const latest = entries[0];
  const latestDate = new Date(latest.entryDate * 1000).toLocaleDateString(
    "ru-RU",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const latestDesc = latest.section
    ? `${latest.section}: ${latest.description}`
    : latest.description;

  return (
    <div className="mt-8">
      <p className="text-sm text-muted-foreground mb-3">
        Последнее обновление: {latestDate} — {latestDesc}
      </p>

      <details className="border border-border rounded-lg">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none hover:bg-muted transition-colors rounded-lg list-none flex items-center justify-between">
          <span>Журнал изменений</span>
          <span className="text-muted-foreground text-xs">
            {entries.length}
          </span>
        </summary>
        <ul className="border-t border-border divide-y divide-border">
          {entries.map((entry) => {
            const date = new Date(entry.entryDate * 1000).toLocaleDateString(
              "ru-RU",
              { year: "numeric", month: "long", day: "numeric" },
            );
            return (
              <li key={entry.id} className="px-4 py-3 text-sm">
                <span className="text-muted-foreground">{date}</span>
                {entry.section && (
                  <span className="font-medium ml-2 text-foreground">
                    {entry.section}:
                  </span>
                )}
                <span className="ml-2">{entry.description}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
