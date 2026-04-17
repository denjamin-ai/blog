import { Diagram } from "./diagram";
import { Mermaid } from "./mermaid";
import { Circuit } from "./circuit";

interface WrapperProps {
  children: React.ReactNode;
  source: string;
  label: string;
}

function SourceShell({ children, source, label }: WrapperProps) {
  return (
    <div className="my-4">
      {children}
      <details className="mt-2 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none inline-flex items-center gap-1 py-1 px-2 rounded border border-border bg-muted/40 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span>
          <span>Исходник {label}</span>
        </summary>
        <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words">
          <code className="font-mono text-foreground">{source}</code>
        </pre>
      </details>
    </div>
  );
}

export function ReviewMermaid({ chart = "" }: { chart?: string }) {
  return (
    <SourceShell source={chart} label="Mermaid">
      <Mermaid chart={chart} />
    </SourceShell>
  );
}

export function ReviewDiagram({
  type = "",
  chart = "",
}: {
  type?: string;
  chart?: string;
}) {
  return (
    <SourceShell source={chart} label={type || "Diagram"}>
      <Diagram type={type} chart={chart} />
    </SourceShell>
  );
}

export function ReviewCircuit({ code = "" }: { code?: string }) {
  return (
    <SourceShell source={code} label="Circuit (TikZ)">
      <Circuit code={code} />
    </SourceShell>
  );
}
