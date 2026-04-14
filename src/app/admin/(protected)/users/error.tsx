"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <p className="text-red-500 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  );
}
