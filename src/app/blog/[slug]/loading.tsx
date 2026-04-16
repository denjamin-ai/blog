export default function ArticleLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 motion-safe:animate-pulse">
      {/* Cover image */}
      <div className="aspect-video w-full bg-muted rounded-xl mb-8" />

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-20 bg-muted rounded-full" />
      </div>

      {/* Title */}
      <div className="h-9 bg-muted rounded-lg w-3/4 mb-3" />
      <div className="h-9 bg-muted rounded-lg w-1/2 mb-6" />

      {/* Meta row */}
      <div className="flex gap-4 mb-10">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Content lines */}
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-11/12" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-11/12" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-11/12" />
      </div>
    </div>
  );
}
