interface ArticleVideoProps {
  src: string;
  poster?: string;
}

export function ArticleVideo({ src, poster }: ArticleVideoProps) {
  return (
    <div className="my-6 rounded-xl overflow-hidden border border-border/50 shadow-sm">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={src}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className="w-full block"
      />
    </div>
  );
}
