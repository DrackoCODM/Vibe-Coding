import { describe, expect, it } from 'vitest';
import { PAGE_SIZES, clamp, mmToPx } from './index';

describe('clamp', () => {
  it('returns value when inside range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('mmToPx', () => {
  it('converts one inch (25.4mm) to 96px', () => {
    expect(mmToPx(25.4)).toBeCloseTo(96);
  });

  it('converts A4 width to expected px', () => {
    expect(mmToPx(PAGE_SIZES.a4.widthMm)).toBeCloseTo(793.7, 1);
  });
});
