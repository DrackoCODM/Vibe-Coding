import { useEffect } from 'react';

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

/** About dialog with app overview and useful shortcuts. */
export function AboutDialog({ open, onClose }: AboutDialogProps) {
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
      data-testid="about-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="About Project Gratis"
        className="w-full max-w-md rounded-xl border border-line bg-raised p-5 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">About Project Gratis</h2>
        <p className="mt-2 text-xs text-muted">
          GratisDraft is a free Microsoft Word–like editor. Everything stays in local files — write
          now, work later. Your work advances every time you use it: orientation, columns,
          watermarks, page breaks, headers and footers, footnotes, comments, tables of contents,
          captions, bookmarks and cross-references.
        </p>
        <ul className="mt-3 space-y-1 text-2xs text-faint">
          <li>Ctrl+B / I / U — bold, italic, underline</li>
          <li>Ctrl+F / H — find, replace</li>
          <li>Ctrl+P — export as PDF (print)</li>
          <li>Mod+Enter — insert a manual page break</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
