export type Verdict = "approved" | "needs_work" | "rejected";

const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; icon: string; className: string }
> = {
  approved: {
    label: "Одобрено",
    icon: "✅",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  needs_work: {
    label: "Требует доработки",
    icon: "⚠️",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  rejected: {
    label: "Отклонено",
    icon: "❌",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
