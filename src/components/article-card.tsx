import Link from "next/link";
import Image from "next/image";
import { parseTags } from "@/lib/utils";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { BookmarkButton } from "@/components/bookmark-button";

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
  // engagement (optional — omit to hide)
  id?: string;
  rating?: number;
  bookmarked?: boolean;
  bookmarkCount?: number;
  // author (null = admin-created article, show nothing)
  authorName?: string | null;
  authorSlug?: string | null;
  authorAvatarUrl?: string | null;
  // stagger animation index
  index?: number;
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
  id,
  rating,
  bookmarked,
  bookmarkCount,
  authorName,
  authorSlug,
  authorAvatarUrl,
  index,
}: ArticleCardProps) {
  const parsedTags = parseTags(tags);
  const date = publishedAt
    ? new Date(publishedAt * 1000).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <article
      className="animate-in group relative flex flex-col rounded-lg border border-border hover:border-foreground/15 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden bg-elevated"
      style={{ "--index": index ?? 0 } as React.CSSProperties}
    >
      {/* Bookmark button — top-right, visible on hover */}
      {id && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-150">
          <div className="bg-background/85 backdrop-blur-sm rounded-md p-1">
            <BookmarkButton
              articleId={id}
              initialBookmarked={bookmarked ?? false}
              initialCount={bookmarkCount ?? 0}
            />
          </div>
        </div>
      )}

      {/* Cover image 16/9 */}
      {coverImageUrl && (
        <Link href={`/blog/${slug}`} tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover motion-safe:transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
          </div>
        </Link>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <Link href={`/blog/${slug}`}>
          <h3 className="font-display font-semibold text-lg leading-snug mb-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3 leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Spacer pushes meta to bottom */}
        <div className="flex-1" />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-3">
          {date && <span>{date}</span>}
          {readingTime !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readingTime} мин</span>
            </>
          )}
          {rating !== undefined && rating !== 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{rating > 0 ? `+${rating}` : rating}</span>
            </>
          )}
          {viewCount !== undefined && viewCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{viewCount} просм.</span>
            </>
          )}
          {difficulty && (
            <>
              <span aria-hidden="true">·</span>
              <DifficultyBadge difficulty={difficulty} />
            </>
          )}
        </div>

        {/* Author */}
        {authorName && (
          <div className="flex items-center gap-1.5 mt-2">
            {authorAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              />
            )}
            {authorSlug ? (
              <Link
                href={`/authors/${authorSlug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">
                {authorName}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
