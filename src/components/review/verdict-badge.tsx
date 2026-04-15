export type Verdict = "approved" | "needs_work" | "rejected";

const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; icon: string; className: string }
> = {
  approved: {
    label: "Одобрено",
    icon: "✅",
    className: "bg-success-bg text-success",
  },
  needs_work: {
    label: "Требует доработки",
    icon: "⚠️",
    className: "bg-warning-bg text-warning",
  },
  rejected: {
    label: "Отклонено",
    icon: "❌",
    className: "bg-danger-bg text-danger",
  },
};

interface Props {
  verdict: string | null | undefined;
  size?: "sm" | "md";
}

export function VerdictBadge({ verdict, size = "sm" }: Props) {
  if (!verdict || !(verdict in VERDICT_CONFIG)) return null;

  const config = VERDICT_CONFIG[verdict as Verdict];
  const padding = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} ${config.className}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
