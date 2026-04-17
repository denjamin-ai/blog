interface ArticleVideoProps {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
}

export function ArticleVideo({ src, poster, width, height }: ArticleVideoProps) {
  const hasCustomSize = width !== undefined || height !== undefined;

  return (
    <div
      className="my-6 rounded-xl overflow-hidden border border-border/50 shadow-sm"
      style={hasCustomSize ? {
        maxWidth: width ? `${width}px` : undefined,
      } : undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={src}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className="w-full block"
        style={hasCustomSize ? {
          maxHeight: height ? `${height}px` : undefined,
        } : undefined}
      />
    </div>
  );
}
