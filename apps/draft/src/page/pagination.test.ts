import { describe, expect, it } from 'vitest';
import { computePageCount, computePageLayout, pageForLayout, pageForOffset } from './pagination';

describe('computePageCount', () => {
  it('returns 1 for content that fits one page', () => {
    expect(computePageCount(500, 1000)).toBe(1);
  });

  it('rounds up to the next page when content overflows', () => {
    expect(computePageCount(1001, 1000)).toBe(2);
    expect(computePageCount(2500, 1000)).toBe(3);
  });

  it('returns at least 1 page for empty content', () => {
    expect(computePageCount(0, 1000)).toBe(1);
  });

  it('guards against non-positive usable height', () => {
    expect(computePageCount(100, 0)).toBe(1);
  });
});

describe('pageForOffset', () => {
  it('maps offsets to 1-based pages', () => {
    expect(pageForOffset(0, 1000, 3)).toBe(1);
    expect(pageForOffset(999, 1000, 3)).toBe(1);
    expect(pageForOffset(1000, 1000, 3)).toBe(2);
    expect(pageForOffset(2500, 1000, 3)).toBe(3);
  });

  it('clamps to the last page', () => {
    expect(pageForOffset(5000, 1000, 3)).toBe(3);
  });
});

describe('computePageLayout', () => {
  it('matches plain pagination when there are no breaks', () => {
    const layout = computePageLayout(2500, 1000);
    expect(layout.pageCount).toBe(3);
    expect(layout.pageStartsPx).toEqual([0, 1000, 2000]);
    expect(layout.naturalBoundariesPx).toEqual([1000, 2000]);
  });

  it('starts a new page at a manual break', () => {
    // 1500px of content, break at 900; page 1 holds the first ~900px, page 2 the rest.
    const layout = computePageLayout(1500, 1000, [900]);
    expect(layout.pageCount).toBe(2);
    expect(layout.pageStartsPx).toEqual([0, 900]);
    // The break boundary is forced, so no dashed natural markers appear.
    expect(layout.naturalBoundariesPx).toEqual([]);
  });

  it('adds natural boundaries within a segment longer than one page', () => {
    // Content of 3500px with a break at 1200: segment 0..1200 spans 2 pages
    // (boundary at 1000), then pages for 1200..2300 and 2300..3500.
    const layout = computePageLayout(3500, 1000, [1200]);
    expect(layout.pageStartsPx).toEqual([0, 1000, 1200, 2200, 3200]);
    expect(layout.pageCount).toBe(5);
    expect(layout.naturalBoundariesPx).toEqual([1000, 2200, 3200]);
  });

  it('ignores negative breaks and breaks at or beyond the content end', () => {
    expect(computePageLayout(1000, 1000, [-5, 1000, 1200])).toEqual(computePageLayout(1000, 1000));
  });

  it('guards against non-positive usable height', () => {
    const layout = computePageLayout(2000, 0, [100]);
    expect(layout.pageCount).toBe(1);
    expect(layout.pageStartsPx).toEqual([0]);
  });
});

describe('pageForLayout', () => {
  it('maps offsets to pages using break-aware starts', () => {
    const starts = [0, 900, 1900];
    expect(pageForLayout(0, starts)).toBe(1);
    expect(pageForLayout(899, starts)).toBe(1);
    expect(pageForLayout(900, starts)).toBe(2);
    expect(pageForLayout(5000, starts)).toBe(3);
  });
});
