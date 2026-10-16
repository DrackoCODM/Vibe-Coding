import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

export interface CitationDialogProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

/** Prompt for a citation key/title and insert an inline citation marker. */
export function CitationDialog({ editor, open, onClose }: CitationDialogProps) {
  const [citeKey, setCiteKey] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (open) {
      setCiteKey('');
      setTitle('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const insert = () => {
    const key = citeKey.trim() || `ref${Math.floor(Math.random() * 9000) + 1000}`;
    const cleanTitle = title.trim() || key;
    void editor?.chain().focus().insertCitation({ citeKey: key, title: cleanTitle }).run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      data-testid="citation-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Add citation"
        className="w-full max-w-sm rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Add citation</h2>
        <p className="mt-1 text-2xs text-muted">
          Inline citations are numbered [1] in document order and collected by the Bibliography
          block.
        </p>
        <label className="mt-3 block text-xs">
          <span className="text-muted">Citation key</span>
          <input
            aria-label="Citation key"
            className="gratis-input mt-1 w-full"
            value={citeKey}
            placeholder="doe2024"
            onChange={(e) => setCiteKey(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-xs">
          <span className="text-muted">Title</span>
          <input
            aria-label="Citation title"
            className="gratis-input mt-1 w-full"
            value={title}
            placeholder="The Book, 2024"
            onChange={(e) => setTitle(e.target.value)}
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
            onClick={insert}
          >
            Add citation
          </button>
        </div>
      </div>
    </div>
  );
}
