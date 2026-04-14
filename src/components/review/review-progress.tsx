interface Props {
  resolved: number;
  total: number;
}

export function ReviewProgress({ resolved, total }: Props) {
  if (total === 0) {
    return <p className="text-xs text-muted-foreground">Замечаний пока нет</p>;
  }

  const pct = Math.round((resolved / total) * 100);
  const allDone = resolved === total;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${allDone ? "text-green-600 dark:text-green-400" : "text-foreground"}`}
        >
          {allDone
            ? "Все замечания решены"
            : `Решено ${resolved} из ${total} замечаний`}
        </span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
