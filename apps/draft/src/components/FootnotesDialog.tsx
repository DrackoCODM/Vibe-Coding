import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { FootnoteNote } from '../editor/doc';
import { removeFootnote } from '../editor/footnotes';

export interface FootnotesDialogProps {
  editor: Editor | null;
  open: boolean;
  footnotes: FootnoteNote[];
  onApply: (footnotes: FootnoteNote[]) => void;
  onClose: () => void;
}

export function FootnotesDialog({
  editor,
  open,
  footnotes,
  onApply,
  onClose,
}: FootnotesDialogProps) {
  const [notes, setNotes] = useState<FootnoteNote[]>(footnotes);

  useEffect(() => {
    if (open) setNotes(footnotes);
  }, [open, footnotes]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const updateNote = (index: number, text: string) => {
    setNotes((prev) => prev.map((note, i) => (i === index ? { ...note, text } : note)));
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      data-testid="footnotes-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Footnotes"
        className="flex max-h-96 w-full max-w-lg flex-col rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Footnotes</h2>
        <p className="mt-1 text-2xs text-muted">
          Notes are numbered automatically in document order and print at the bottom of the page
          containing their reference.
        </p>
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {notes.length === 0 && (
            <p className="text-xs text-faint">
              No footnotes yet. Place the cursor in the document and choose Add footnote.
            </p>
          )}
          {notes.map((note, index) => (
            <div key={note.id} className="flex items-start gap-2">
              <label className="flex-1 text-xs text-muted">
                <span className="sr-only">Footnote {index + 1} text</span>
                <textarea
                  aria-label={`Footnote ${index + 1} text`}
                  className="gratis-input h-16 w-full resize-none font-normal"
                  value={note.text}
                  onChange={(event) => updateNote(index, event.target.value)}
                />
              </label>
              <button
                type="button"
                aria-label={`Delete footnote ${index + 1} and its references`}
                className="mt-1 shrink-0 rounded-md px-2 py-1 text-2xs text-danger hover:bg-danger/10"
                disabled={!editor}
                onClick={() => {
                  if (!editor) return;
                  removeFootnote(editor, note.id);
                  setNotes((prev) => prev.filter((n) => n.id !== note.id));
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
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
            onClick={() => {
              onApply(notes);
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
