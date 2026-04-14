import Link from "next/link";
import Image from "next/image";
import { parseTags } from "@/lib/utils";
import { DifficultyBadge } from "@/components/difficulty-badge";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  tags: string;
  publishedAt: number | null;
  coverImageUrl?: string | null;
  difficulty?: string | null;
  readingTime?: number;
  viewCount?: number;
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  tags,
  publishedAt,
  coverImageUrl,
  difficulty,
  readingTime,
  viewCount,
}: ArticleCardProps) {
  const parsedTags = parseTags(tags);
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
      className="block rounded-lg border border-border hover:border-accent/50 transition-colors overflow-hidden"
    >
      {coverImageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {excerpt && (
          <p className="text-muted-foreground text-sm mb-3">{excerpt}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {date && <span>{date}</span>}
          {readingTime !== undefined && <span>{readingTime} мин чтения</span>}
          {viewCount !== undefined && viewCount > 0 && (
            <span>{viewCount} просмотров</span>
          )}
          {difficulty && <DifficultyBadge difficulty={difficulty} />}
          {parsedTags.length > 0 && (
            <div className="flex gap-1.5">
              {parsedTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
