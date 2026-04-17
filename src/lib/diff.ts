import { diffLines, diffWords } from "diff";

export type DiffChunk = {
  type: "added" | "removed" | "unchanged";
  value: string;
};

export function computeDiff(oldText: string, newText: string): DiffChunk[] {
  const changes = diffLines(oldText, newText);
  return changes.map((change) => ({
    type: change.added ? "added" : change.removed ? "removed" : "unchanged",
    value: change.value,
  }));
}

export function computeWordDiff(oldText: string, newText: string): DiffChunk[] {
  const changes = diffWords(oldText, newText);
  return changes.map((change) => ({
    type: change.added ? "added" : change.removed ? "removed" : "unchanged",
    value: change.value,
  }));
}
