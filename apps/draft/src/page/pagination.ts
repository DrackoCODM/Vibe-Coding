/** Number of pages needed for the given content height (at least 1). */
export function computePageCount(contentHeightPx: number, usablePageHeightPx: number): number {
  if (usablePageHeightPx <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeightPx / usablePageHeightPx));
}

/** 1-based page index for a content-space y offset. */
export function pageForOffset(yPx: number, usablePageHeightPx: number, pageCount: number): number {
  if (usablePageHeightPx <= 0) return 1;
  const page = Math.floor(yPx / usablePageHeightPx) + 1;
  return Math.min(Math.max(1, page), pageCount);
}

export interface PageLayout {
  pageCount: number;
  /** Content-space y offset where each page begins. */
  pageStartsPx: number[];
  /** Natural (non manual-break) boundaries in content space, for dashed markers. */
  naturalBoundariesPx: number[];
}

const BREAK_EPSILON_PX = 1;

/** Collapse break offsets that are within one pixel of each other. */
function dedupeBreaks(offsets: number[]): number[] {
  const sorted = [...offsets].sort((a, b) => a - b);
  const result: number[] = [];
  for (const offset of sorted) {
    if (result.length === 0 || offset - result[result.length - 1] >= BREAK_EPSILON_PX) {
      result.push(offset);
    }
  }
  return result;
}

/**
 * Compute the page layout of the content flow, honouring manual page breaks.
 * A break at content-space y=O ends its page early; later content starts on a
 * fresh page. The break node's own height belongs to the page it closes.
 */
export function computePageLayout(
  contentHeightPx: number,
  usablePageHeightPx: number,
  breakOffsetsPx: number[] = [],
): PageLayout {
  if (usablePageHeightPx <= 0) {
    return { pageCount: 1, pageStartsPx: [0], naturalBoundariesPx: [] };
  }
  const breaks = dedupeBreaks(breakOffsetsPx.filter((o) => o > 0 && o < contentHeightPx));
  const boundaries: { y: number; forced: boolean }[] = [];
  let prev = 0;
  for (const offset of breaks) {
    const segmentPages = Math.ceil((offset - prev) / usablePageHeightPx);
    for (let k = 1; k <= segmentPages - 1; k += 1) {
      boundaries.push({ y: prev + k * usablePageHeightPx, forced: false });
    }
    boundaries.push({ y: offset, forced: true });
    prev = offset;
  }
  const tail = contentHeightPx - prev;
  const tailPages = Math.ceil(tail / usablePageHeightPx);
  for (let k = 1; k <= tailPages - 1; k += 1) {
    boundaries.push({ y: prev + k * usablePageHeightPx, forced: false });
  }
  const pageStartsPx = [0, ...boundaries.map((b) => b.y)];
  return {
    pageCount: Math.max(1, pageStartsPx.length),
    pageStartsPx,
    naturalBoundariesPx: boundaries.filter((b) => !b.forced).map((b) => b.y),
  };
}

/** 1-based page index for a content-space y offset within a computed layout. */
export function pageForLayout(yPx: number, pageStartsPx: number[]): number {
  let page = 1;
  for (let i = 1; i < pageStartsPx.length; i += 1) {
    if (yPx < pageStartsPx[i]) break;
    page = i + 1;
  }
  return page;
}
