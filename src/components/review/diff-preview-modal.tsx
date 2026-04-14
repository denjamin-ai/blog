"use client";

import { DiffView } from "@/components/review/diff-view";

interface Props {
  assignmentId: string;
  onConfirm: () => void;
  onClose: () => void;
  confirming: boolean;
}

export function DiffPreviewModal({
  assignmentId,
  onConfirm,
  onClose,
  confirming,
}: Props) {
  return (
    <dialog
      open
      className="fixed inset-0 w-full h-full p-0 m-0 max-w-none max-h-none border-0 z-50 bg-black/50"
    >
      <div
        className="relative w-full h-full flex flex-col bg-background max-w-4xl mx-auto my-8 rounded-xl border border-border shadow-xl overflow-hidden"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold">
            Изменения с момента назначения ревью
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-hidden">
          <DiffView
            assignmentId={assignmentId}
            diffUrl={`/api/author/assignments/${assignmentId}/diff`}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {confirming ? "Отправка…" : "Отправить уведомление"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
