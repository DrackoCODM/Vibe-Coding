import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { findBookmarks, type CrossRefType } from '../editor/bookmarks';
import { findCaptions } from '../editor/captions';

interface RefOption {
  refType: CrossRefType;
  id: string;
  text: string;
}

export interface CrossRefDialogProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

export function availableRefTargets(editor: Editor): RefOption[] {
  const options: RefOption[] = [];
  for (const bookmark of findBookmarks(editor.state.doc)) {
    options.push({ refType: 'bookmark', id: bookmark.bookmarkId, text: bookmark.refLabel });
  }
  let figure = 0;
  let table = 0;
  for (const caption of findCaptions(editor.state.doc)) {
    if (!caption.cid) continue;
    if (caption.label === 'Figure') {
      figure += 1;
      options.push({ refType: 'figure', id: caption.cid, text: `Figure ${figure}` });
    } else {
      table += 1;
      options.push({ refType: 'table', id: caption.cid, text: `Table ${table}` });
    }
  }
  return options;
}

/** Pick a bookmark/caption target and insert a cross-reference at the cursor. */
export function CrossRefDialog({ editor, open, onClose }: CrossRefDialogProps) {
  const [targets, setTargets] = useState<RefOption[]>([]);

  useEffect(() => {
    if (open && editor) setTargets(availableRefTargets(editor));
  }, [open, editor]);

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
      data-testid="crossref-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Cross-reference"
        className="w-full max-w-md rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Insert cross-reference</h2>
        <p className="mt-1 text-2xs text-muted">
          Choose a bookmark or caption. Labels refresh automatically as the document changes.
        </p>
        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
          {targets.length === 0 && (
            <p className="text-xs text-faint">
              No bookmarks or captions yet. Insert a caption or bookmark first.
            </p>
          )}
          {targets.map((target) => (
            <button
              key={`${target.refType}:${target.id}`}
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent-subtle"
              disabled={!editor}
              onClick={() => {
                void editor?.chain().focus().insertCrossRef(target.refType, target.id).run();
                onClose();
              }}
            >
              <span>{target.text}</span>
              <span className="text-2xs text-faint">{refTypeLabel(target.refType)}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-accent-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function refTypeLabel(refType: CrossRefType): string {
  if (refType === 'bookmark') return 'Bookmark';
  return refType === 'figure' ? 'Figure' : 'Table';
}

// Re-exported for tests
export type { RefOption };
