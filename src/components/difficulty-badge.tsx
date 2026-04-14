const DIFFICULTY_MAP = {
  simple: {
    label: "Простой",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "Средний",
    classes:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  hard: {
    label: "Сложный",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
