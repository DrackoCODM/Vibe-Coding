import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { CommentItem } from '../editor/doc';
import { removeComment } from '../editor/comments';

export interface CommentsDialogProps {
  editor: Editor | null;
  open: boolean;
  comments: CommentItem[];
  onApply: (comments: CommentItem[]) => void;
  onClose: () => void;
}

export function CommentsDialog({ editor, open, comments, onApply, onClose }: CommentsDialogProps) {
  const [items, setItems] = useState<CommentItem[]>(comments);

  useEffect(() => {
    if (open) setItems(comments);
  }, [open, comments]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const update = (id: string, patch: Partial<CommentItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      data-testid="comments-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Comments"
        className="flex max-h-96 w-full max-w-lg flex-col rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Comments</h2>
        <p className="mt-1 text-2xs text-muted">
          Select text and choose Add comment to discuss a passage. Comments stay in the .gdraft
          file.
        </p>
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {items.length === 0 && (
            <p className="text-xs text-faint">
              No comments yet. Select some text in the document and choose Add comment.
            </p>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-lg border p-2 ${
                item.resolved ? 'border-line bg-accent-subtle/40' : 'border-line'
              }`}
            >
              <div className="flex items-center justify-between text-2xs text-faint">
                <span>
                  {item.author} · {new Date(item.createdAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  aria-label={
                    item.resolved
                      ? `Unresolve comment ${index + 1}`
                      : `Resolve comment ${index + 1}`
                  }
                  className="rounded px-2 py-0.5 hover:bg-accent-subtle"
                  onClick={() => update(item.id, { resolved: !item.resolved })}
                >
                  {item.resolved ? 'Unresolve' : 'Resolve'}
                </button>
              </div>
              <textarea
                aria-label={`Comment ${index + 1} text`}
                className="gratis-input mt-1 h-16 w-full resize-none"
                value={item.text}
                onChange={(event) => update(item.id, { text: event.target.value })}
              />
              <button
                type="button"
                aria-label={`Delete comment ${index + 1} and its highlight`}
                className="mt-1 rounded-md px-2 py-1 text-2xs text-danger hover:bg-danger/10"
                disabled={!editor}
                onClick={() => {
                  if (!editor) return;
                  removeComment(editor, item.id);
                  setItems((prev) => prev.filter((comment) => comment.id !== item.id));
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
              onApply(items);
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
