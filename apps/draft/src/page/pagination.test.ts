import { describe, expect, it } from 'vitest';
import { computePageCount, pageForOffset } from './pagination';

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
