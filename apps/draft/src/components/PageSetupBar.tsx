import type { PageSizeName } from '@gratis/shared';
import { MARGIN_PRESETS, type MarginPresetName } from '../page/margins';

export const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

export interface PageSetup {
  pageSize: PageSizeName;
  marginPreset: MarginPresetName;
  zoomPercent: number;
}

export interface PageSetupBarProps {
  setup: PageSetup;
  onChange: (setup: PageSetup) => void;
}

export function PageSetupBar({ setup, onChange }: PageSetupBarProps) {
  const selectClass =
    'gratis-focus-ring rounded border border-gray-300 bg-white px-1 py-0.5 text-sm dark:border-gray-600 dark:bg-gray-900';
  return (
    <div
      role="toolbar"
      aria-label="Page setup"
      className="flex items-center gap-3 border-b border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <label className="flex items-center gap-1">
        Size
        <select
          aria-label="Page size"
          className={selectClass}
          value={setup.pageSize}
          onChange={(e) => onChange({ ...setup, pageSize: e.target.value as PageSizeName })}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>
      </label>
      <label className="flex items-center gap-1">
        Margins
        <select
          aria-label="Margin preset"
          className={selectClass}
          value={setup.marginPreset}
          onChange={(e) => onChange({ ...setup, marginPreset: e.target.value as MarginPresetName })}
        >
          <option value="normal">Normal</option>
          <option value="moderate">Moderate</option>
          <option value="narrow">Narrow</option>
          <option value="wide">Wide</option>
        </select>
      </label>
      <label className="flex items-center gap-1">
        Zoom
        <select
          aria-label="Zoom"
          className={selectClass}
          value={setup.zoomPercent}
          onChange={(e) => onChange({ ...setup, zoomPercent: Number(e.target.value) })}
        >
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}%
            </option>
          ))}
        </select>
      </label>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {MARGIN_PRESETS[setup.marginPreset].topMm === MARGIN_PRESETS[setup.marginPreset].leftMm
          ? `${MARGIN_PRESETS[setup.marginPreset].topMm} mm margins`
          : 'Mixed margins'}
      </span>
    </div>
  );
}
