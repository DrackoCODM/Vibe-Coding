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
