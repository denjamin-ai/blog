import DiffMatchPatch from "diff-match-patch";
import type {
  AnchorData,
  AnchorType,
  TextQuoteSelector,
  TextPositionSelector,
} from "@/types";

const dmp = new DiffMatchPatch();
dmp.Match_Threshold = 0.4;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build AnchorData from a browser Selection Range within a container element.
 */
export function createAnchor(
  range: Range,
  container: HTMLElement,
): AnchorData {
  const selectors: (TextQuoteSelector | TextPositionSelector)[] = [];

  const anchorEl = findAnchorElement(range.startContainer, container);
  const anchorId = anchorEl?.getAttribute("data-anchor-id") ?? undefined;
  const anchorType: AnchorType = anchorId ? "text" : "general";

  const exact = range.toString();
  const fullText = container.textContent || "";
  const position = getTextPosition(range, container);
  const prefix = fullText.slice(
    Math.max(0, position.start - 32),
    position.start,
  );
  const suffix = fullText.slice(position.end, position.end + 32);

  selectors.push({ type: "TextQuoteSelector", exact, prefix, suffix });
  selectors.push({
    type: "TextPositionSelector",
    start: position.start,
    end: position.end,
  });

  return { anchorType, anchorId, selectors };
}

/**
 * Resolve AnchorData back to a Range in the rendered content.
 *
 * Cascade:
 * 1. Exact match within scoped anchor element
 * 2. Fuzzy match within scoped anchor element
 * 3. Exact match within full container
 * 4. Fuzzy match within full container
 * 5. null (orphan)
 */
export function resolveAnchor(
  anchorData: AnchorData,
  container: HTMLElement,
): Range | null {
  const quoteSelector = anchorData.selectors.find(
    (s): s is TextQuoteSelector => s.type === "TextQuoteSelector",
  );
  if (!quoteSelector) return null;

  const scopeEl = anchorData.anchorId
    ? (container.querySelector(
        `[data-anchor-id="${CSS.escape(anchorData.anchorId)}"]`,
      ) as HTMLElement | null)
    : null;

  const candidates = [scopeEl, container].filter(
    (el): el is HTMLElement => el !== null,
  );

  for (const el of candidates) {
    const result = findExactMatch(quoteSelector.exact, el);
    if (result) return result;
  }

  for (const el of candidates) {
    const result = findFuzzyMatch(quoteSelector, el);
    if (result) return result;
  }

  return null;
}

/**
 * Check if anchor data can no longer be resolved in the current content.
 */
export function isOrphan(
  anchorData: AnchorData,
  container: HTMLElement,
): boolean {
  return resolveAnchor(anchorData, container) === null;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function findAnchorElement(
  node: Node,
  boundary: HTMLElement,
): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== boundary) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-anchor-id")
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function getTextPosition(
  range: Range,
  container: HTMLElement,
): { start: number; end: number } {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let offset = 0;
  let start = 0;
  let end = 0;
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const len = node.textContent?.length ?? 0;

    if (node === range.startContainer) {
      start = offset + range.startOffset;
    }
    if (node === range.endContainer) {
      end = offset + range.endOffset;
      break;
    }
    offset += len;
  }

  return { start, end };
}

function findExactMatch(
  exact: string,
  container: HTMLElement,
): Range | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let offset = 0;
  let node: Text | null;
  const fullText = container.textContent || "";
  const idx = fullText.indexOf(exact);
  if (idx === -1) return null;

  const targetStart = idx;
  const targetEnd = idx + exact.length;

  while ((node = walker.nextNode() as Text | null)) {
    const len = node.textContent?.length ?? 0;
    const nodeStart = offset;
    const nodeEnd = offset + len;

    if (nodeEnd > targetStart && nodeStart < targetEnd) {
      const range = document.createRange();

      if (nodeStart <= targetStart && nodeEnd >= targetEnd) {
        range.setStart(node, targetStart - nodeStart);
        range.setEnd(node, targetEnd - nodeStart);
        return range;
      }

      if (nodeStart <= targetStart) {
        range.setStart(node, targetStart - nodeStart);
        // Walk forward for end node
        let remaining = targetEnd;
        let endNode: Text | null = node;
        let endOffset = offset;
        while (endNode) {
          const eLen = endNode.textContent?.length ?? 0;
          if (endOffset + eLen >= remaining) {
            range.setEnd(endNode, remaining - endOffset);
            return range;
          }
          endOffset += eLen;
          endNode = walker.nextNode() as Text | null;
        }
      }
    }

    offset += len;
  }

  return null;
}

function findFuzzyMatch(
  quoteSelector: TextQuoteSelector,
  container: HTMLElement,
): Range | null {
  const fullText = container.textContent || "";
  if (!fullText || !quoteSelector.exact) return null;

  const matchIndex = dmp.match_main(fullText, quoteSelector.exact, 0);
  if (matchIndex === -1) return null;

  // Disambiguate with prefix/suffix if available
  if (quoteSelector.prefix) {
    const prefixEnd = fullText.indexOf(
      quoteSelector.prefix,
      Math.max(0, matchIndex - quoteSelector.prefix.length - 10),
    );
    if (prefixEnd !== -1) {
      const expectedStart = prefixEnd + quoteSelector.prefix.length;
      if (Math.abs(expectedStart - matchIndex) > quoteSelector.exact.length) {
        return null;
      }
    }
  }

  const matchEnd = matchIndex + quoteSelector.exact.length;
  return textOffsetToRange(container, matchIndex, matchEnd);
}

function textOffsetToRange(
  container: HTMLElement,
  start: number,
  end: number,
): Range | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let offset = 0;
  let node: Text | null;
  let startNode: Text | null = null;
  let startOffset = 0;

  while ((node = walker.nextNode() as Text | null)) {
    const len = node.textContent?.length ?? 0;

    if (!startNode && offset + len > start) {
      startNode = node;
      startOffset = start - offset;
    }
    if (startNode && offset + len >= end) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(node, end - offset);
      return range;
    }

    offset += len;
  }

  return null;
}
