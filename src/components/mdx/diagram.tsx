import { createHash } from "crypto";

interface DiagramProps {
  type?: string;
  chart?: string;
}

const SUPPORTED_TYPES = new Set([
  "plantuml",
  "bpmn",
  "wavedrom",
  "graphviz",
  "d2",
  "svgbob",
  "tikz",
]);

// Module-level cache: persists across requests within one server process
const svgCache = new Map<string, string>();

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, "");
}

function Fallback({ chart }: { chart: string }) {
  return (
    <pre className="my-4 p-4 border border-border rounded-lg text-sm text-muted-foreground overflow-x-auto">
      <code>{chart}</code>
    </pre>
  );
}

export async function Diagram({ type = "", chart = "" }: DiagramProps) {
  if (!chart || !SUPPORTED_TYPES.has(type)) {
    return <Fallback chart={chart} />;
  }

  const key = createHash("sha256").update(`${type}:${chart}`).digest("hex");
  let svg = svgCache.get(key);

  if (!svg) {
    try {
      const res = await fetch(`https://kroki.io/${type}/svg`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: chart,
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.text();
        if (typeof body === "string" && body.length > 0) {
          svg = sanitizeSvg(body);
          svgCache.set(key, svg);
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  if (!svg) {
    return <Fallback chart={chart} />;
  }

  return (
    <div
      className="my-4 overflow-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
