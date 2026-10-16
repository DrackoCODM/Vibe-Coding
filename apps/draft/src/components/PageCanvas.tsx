import { PAGE_SIZES, mmToPx } from '@gratis/shared';

export function PageCanvas() {
  const width = mmToPx(PAGE_SIZES.a4.widthMm);
  const height = mmToPx(PAGE_SIZES.a4.heightMm);
  return (
    <div
      aria-label="Page canvas"
      className="mx-auto bg-white shadow-lg dark:bg-gray-100"
      style={{ width, height }}
    />
  );
}
