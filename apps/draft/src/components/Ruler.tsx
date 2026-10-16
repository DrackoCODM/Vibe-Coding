import { mmToPx, PAGE_SIZES, type PageSizeName } from '@gratis/shared';
import type { Margins } from '../page/margins';

export interface RulerTick {
  mm: number;
  major: boolean;
}

/** Generate ticks every `minorMm` with major marks on each centimetre. */
export function rulerTicks(widthMm: number, minorMm = 5): RulerTick[] {
  const ticks: RulerTick[] = [];
  for (let mm = 0; mm <= widthMm + 0.001; mm += minorMm) {
    ticks.push({ mm, major: Math.abs(mm % 10) < 0.001 });
  }
  return ticks;
}

export interface RulerProps {
  pageSize: PageSizeName;
  margins: Margins;
  zoomPercent: number;
}

export function Ruler({ pageSize, margins, zoomPercent }: RulerProps) {
  const page = PAGE_SIZES[pageSize];
  const zoom = zoomPercent / 100;
  const pxPerMm = mmToPx(1) * zoom;
  const widthPx = mmToPx(page.widthMm) * zoom;
  const leftPx = margins.leftMm * pxPerMm;
  const rightPx = margins.rightMm * pxPerMm;
  const ticks = rulerTicks(page.widthMm);

  return (
    <div data-ruler-strip="" className="border-b border-line bg-raised/60 px-3 py-1">
      <div
        role="img"
        data-testid="ruler"
        aria-label={`Horizontal ruler, ${pageSize.toUpperCase()}, ${zoomPercent} percent zoom`}
        className="relative mx-auto h-4 rounded-sm bg-white/60 dark:bg-white/5"
        style={{ width: widthPx }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-ink/[0.06]"
          style={{ width: leftPx }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 bg-ink/[0.06]"
          style={{ width: rightPx }}
        />
        {ticks.map((tick) => (
          <div
            key={tick.mm}
            data-mm={tick.mm}
            aria-hidden="true"
            className={`absolute bottom-0 w-px ${
              tick.major ? 'h-2 bg-muted/70' : 'h-1 bg-muted/35'
            }`}
            style={{ left: tick.mm * pxPerMm }}
          />
        ))}
        {ticks
          .filter((tick) => tick.major && tick.mm > 0)
          .map((tick) => (
            <span
              key={`label-${tick.mm}`}
              aria-hidden="true"
              className="absolute top-0 -translate-x-1/2 text-2xs leading-none text-faint"
              style={{ left: tick.mm * pxPerMm }}
            >
              {tick.mm / 10}
            </span>
          ))}
      </div>
    </div>
  );
}
