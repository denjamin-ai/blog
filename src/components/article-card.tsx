import Link from "next/link";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  tags: string;
  publishedAt: number | null;
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  tags,
  publishedAt,
}: ArticleCardProps) {
  let parsedTags: string[] = [];
  try {
    parsedTags = tags ? JSON.parse(tags) : [];
  } catch { /* malformed tags */ }
  const date = publishedAt
    ? new Date(publishedAt * 1000).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/blog/${slug}`}
      className="block p-5 rounded-lg border border-border hover:border-accent/50 transition-colors"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {excerpt && (
        <p className="text-muted-foreground text-sm mb-3">{excerpt}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {date && <span>{date}</span>}
        {parsedTags.length > 0 && (
          <div className="flex gap-1.5">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
