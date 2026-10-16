export const APP_NAME = 'Project Gratis';
export const DRAFT_APP_NAME = 'GratisDraft';
export const GDRAFT_FILE_EXTENSION = '.gdraft';
export const GDRAFT_FILE_TYPE = 'application/vnd.gratis.draft+json';

export interface PageSize {
  /** Width in millimetres */
  widthMm: number;
  /** Height in millimetres */
  heightMm: number;
}

export const PAGE_SIZES = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
} as const satisfies Record<string, PageSize>;

export type PageSizeName = keyof typeof PAGE_SIZES;

export const MM_PER_INCH = 25.4;
export const CSS_PX_PER_INCH = 96;

/** Convert millimetres to CSS pixels at the standard 96 DPI web mapping. */
export function mmToPx(mm: number): number {
  return (mm / MM_PER_INCH) * CSS_PX_PER_INCH;
}

/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
