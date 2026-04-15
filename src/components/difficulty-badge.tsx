const DIFFICULTY_MAP = {
  simple: {
    label: "Простой",
    classes: "bg-success-bg text-success",
  },
  medium: {
    label: "Средний",
    classes: "bg-warning-bg text-warning",
  },
  hard: {
    label: "Сложный",
    classes: "bg-danger-bg text-danger",
  },
} as const;

type Difficulty = keyof typeof DIFFICULTY_MAP;

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: string | null | undefined;
}) {
  if (!difficulty || !(difficulty in DIFFICULTY_MAP)) return null;
  const { label, classes } = DIFFICULTY_MAP[difficulty as Difficulty];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
