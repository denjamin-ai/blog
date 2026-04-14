export function estimateReadingTime(content: string): number {
  const codeBlockMarkers = content.match(/```/g) ?? [];
  const codeBlocks = Math.floor(codeBlockMarkers.length / 2);
  const text = content.replace(/```[\s\S]*?```/g, "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = words / 200 + codeBlocks * 0.5;
  return Math.max(1, Math.ceil(minutes));
}
