import type { Editor } from '@tiptap/react';
import type { PageSizeName } from '@gratis/shared';
import { updateDocSettings, type DocSettings } from '../editor/doc';
import { MARGIN_PRESETS, type MarginPresetName } from '../page/margins';

export const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

export interface PageSetup {
  pageSize: PageSizeName;
  marginPreset: MarginPresetName;
  zoomPercent: number;
}

export interface PageSetupBarProps {
  setup: PageSetup;
  settings: DocSettings;
  editor: Editor | null;
  onChange: (setup: PageSetup) => void;
}

export function PageSetupBar({ setup, settings, editor, onChange }: PageSetupBarProps) {
  const disabled = !editor;
  return (
    <div
      role="toolbar"
      aria-label="Page setup"
      className="flex items-center gap-3 border-b border-line bg-raised px-3 py-1.5 text-xs"
    >
      <label className="flex items-center gap-1.5 text-muted">
        Size
        <select
          aria-label="Page size"
          className="gratis-select"
          value={setup.pageSize}
          onChange={(e) => onChange({ ...setup, pageSize: e.target.value as PageSizeName })}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-muted">
        Orientation
        <select
          aria-label="Orientation"
          className="gratis-select"
          disabled={disabled}
          value={settings.orientation}
          onChange={(e) => {
            if (editor)
              updateDocSettings(editor, {
                orientation: e.target.value as DocSettings['orientation'],
              });
          }}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-muted">
        Columns
        <select
          aria-label="Columns"
          className="gratis-select"
          disabled={disabled}
          value={settings.columns}
          onChange={(e) => {
            if (editor) updateDocSettings(editor, { columns: Number(e.target.value) as 1 | 2 | 3 });
          }}
        >
          <option value="1">One</option>
          <option value="2">Two</option>
          <option value="3">Three</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-muted">
        Margins
        <select
          aria-label="Margin preset"
          className="gratis-select"
          value={setup.marginPreset}
          onChange={(e) => onChange({ ...setup, marginPreset: e.target.value as MarginPresetName })}
        >
          <option value="normal">Normal</option>
          <option value="moderate">Moderate</option>
          <option value="narrow">Narrow</option>
          <option value="wide">Wide</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-muted">
        Zoom
        <select
          aria-label="Zoom"
          className="gratis-select"
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
      <label className="flex items-center gap-1.5 text-muted">
        Watermark
        <input
          aria-label="Watermark text"
          type="text"
          className="gratis-input w-32"
          placeholder="None"
          disabled={disabled}
          value={settings.watermarkText}
          onChange={(e) => {
            if (editor) updateDocSettings(editor, { watermarkText: e.target.value });
          }}
        />
      </label>
      <span className="text-2xs text-faint">
        {MARGIN_PRESETS[setup.marginPreset].topMm === MARGIN_PRESETS[setup.marginPreset].leftMm
          ? `${MARGIN_PRESETS[setup.marginPreset].topMm} mm margins`
          : 'Mixed margins'}
      </span>
    </div>
  );
}
