import { useEffect, useState } from 'react';
import type { DocSettings } from '../editor/doc';

export interface HeaderFooterDialogProps {
  open: boolean;
  settings: DocSettings;
  onApply: (headerText: string, footerText: string) => void;
  onClose: () => void;
}

export function HeaderFooterDialog({ open, settings, onApply, onClose }: HeaderFooterDialogProps) {
  const [headerText, setHeaderText] = useState(settings.headerText);
  const [footerText, setFooterText] = useState(settings.footerText);

  useEffect(() => {
    if (open) {
      setHeaderText(settings.headerText);
      setFooterText(settings.footerText);
    }
  }, [open, settings.headerText, settings.footerText]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      data-testid="header-footer-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Header and footer"
        className="w-full max-w-md rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Header and footer</h2>
        <p className="mt-1 text-2xs text-muted">
          Plain text shown in the top and bottom margins of every page. Exported to .docx as
          document headers and footers.
        </p>
        <label className="mt-3 block text-xs text-muted">
          Header text
          <input
            aria-label="Header text"
            className="gratis-input mt-1 w-full"
            value={headerText}
            onChange={(event) => setHeaderText(event.target.value)}
          />
        </label>
        <label className="mt-3 block text-xs text-muted">
          Footer text
          <input
            aria-label="Footer text"
            className="gratis-input mt-1 w-full"
            value={footerText}
            onChange={(event) => setFooterText(event.target.value)}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-accent-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
            onClick={() => onApply(headerText, footerText)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
