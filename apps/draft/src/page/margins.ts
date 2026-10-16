export interface Margins {
  topMm: number;
  rightMm: number;
  bottomMm: number;
  leftMm: number;
}

export const MARGIN_PRESETS = {
  normal: { topMm: 25.4, rightMm: 25.4, bottomMm: 25.4, leftMm: 25.4 },
  narrow: { topMm: 12.7, rightMm: 12.7, bottomMm: 12.7, leftMm: 12.7 },
  moderate: { topMm: 19.05, rightMm: 19.05, bottomMm: 19.05, leftMm: 19.05 },
  wide: { topMm: 25.4, rightMm: 50.8, bottomMm: 25.4, leftMm: 50.8 },
} as const satisfies Record<string, Margins>;

export type MarginPresetName = keyof typeof MARGIN_PRESETS;

/** Distance from the page edge where headers and footers sit (Word default 12.7 mm). */
export const HEADER_DISTANCE_MM = 12.7;
