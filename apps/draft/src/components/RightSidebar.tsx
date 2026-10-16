import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';
import type { CommentItem } from '../editor/doc';
import { removeComment } from '../editor/comments';
import { findBookmarks } from '../editor/bookmarks';
import { findCaptions } from '../editor/captions';
import { collectCitations } from '../editor/citations';

export interface SidebarComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
}

export interface RightSidebarProps {
  editor: Editor | null;
  comments: CommentItem[];
  onCommentsChange: (comments: CommentItem[]) => void;
  tab: 'comments' | 'references';
  onTabChange: (tab: 'comments' | 'references') => void;
  onClose: () => void;
}

/** Right panel: comment thread management or reference navigation. */
export function RightSidebar({
  editor,
  comments,
  onCommentsChange,
  tab,
  onTabChange,
  onClose,
}: RightSidebarProps) {
  const [refs, setRefs] = useState<{
    bookmarks: { bookmarkId: string; refLabel: string }[];
    captions: { cid: string; label: string }[];
    citations: { citeKey: string; title: string }[];
  }>({ bookmarks: [], captions: [], citations: [] });

  useEffect(() => {
    if (!editor) return;
    const refresh = () => {
      setRefs({
        bookmarks: findBookmarks(editor.state.doc),
        captions: findCaptions(editor.state.doc),
        citations: collectCitations(editor.state.doc),
      });
    };
    refresh();
    editor.on('update', refresh);
    return () => {
      editor.off('update', refresh);
    };
  }, [editor]);

  const jump = (pos: number) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection(pos + 1)
      .scrollIntoView()
      .run();
  };

  return (
    <aside
      aria-label="Right sidebar"
      data-testid="right-sidebar"
      className="flex w-72 shrink-0 flex-col border-l border-line bg-raised"
    >
      <div className="flex border-b border-line" role="tablist" aria-label="Right panel tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          className={`flex-1 py-2 text-xs font-medium ${
            tab === 'comments' ? 'bg-accent-subtle text-accent' : 'text-muted hover:text-ink'
          }`}
          onClick={() => onTabChange('comments')}
        >
          Comments
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'references'}
          className={`flex-1 py-2 text-xs font-medium ${
            tab === 'references' ? 'bg-accent-subtle text-accent' : 'text-muted hover:text-ink'
          }`}
          onClick={() => onTabChange('references')}
        >
          References
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tab === 'comments' ? (
          comments.length === 0 ? (
            <p className="px-1 py-2 text-2xs text-faint">
              No comments yet. Select text and choose Add comment.
            </p>
          ) : (
            comments.map((comment, index) => (
              <div
                key={comment.id}
                data-testid={`sidebar-comment-${index}`}
                className={`rounded-lg border border-line p-2 ${
                  comment.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between text-2xs text-faint">
                  <span>{comment.author}</span>
                  <button
                    type="button"
                    className="rounded px-1.5 hover:bg-accent-subtle"
                    onClick={() =>
                      onCommentsChange(
                        comments.map((item) =>
                          item.id === comment.id ? { ...item, resolved: !item.resolved } : item,
                        ),
                      )
                    }
                  >
                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                  </button>
                </div>
                <p className="mt-0.5 line-clamp-3 text-xs text-ink">{comment.text}</p>
                <div className="mt-1 flex gap-2 text-2xs">
                  <button
                    type="button"
                    className="text-accent hover:underline"
                    disabled={!editor}
                    onClick={() => {
                      if (!editor) return;
                      // Find the comment mark's position to jump to it.
                      let found: number | null = null;
                      editor.state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                        if (found !== null) return;
                        if (
                          node.marks.some(
                            (mark) =>
                              mark.type.name === 'comment' && mark.attrs.commentId === comment.id,
                          )
                        ) {
                          found = pos + 1;
                        }
                      });
                      if (found !== null) jump(found);
                    }}
                  >
                    Go to
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete sidebar comment ${index + 1}`}
                    className="text-danger hover:underline"
                    disabled={!editor}
                    onClick={() => {
                      if (!editor) return;
                      removeComment(editor, comment.id);
                      onCommentsChange(comments.filter((item) => item.id !== comment.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="space-y-2">
            <section aria-label="Captions">
              <p className="px-1 text-2xs font-semibold uppercase tracking-wide text-faint">
                Captions
              </p>
              {refs.captions.length === 0 && (
                <p className="px-1 py-1 text-2xs text-faint">No captions yet.</p>
              )}
              {refs.captions.map((caption, index) => (
                <button
                  key={`${caption.cid}-${index}`}
                  type="button"
                  className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted hover:bg-accent-subtle hover:text-ink"
                  disabled={!editor}
                  onClick={() => {
                    if (!editor) return;
                    // Jump to the caption node position by label + index match.
                    const { pos } = captionPos(editor.state.doc, caption.cid) ?? {};
                    if (typeof pos === 'number') jump(pos);
                  }}
                >
                  {caption.label} caption
                </button>
              ))}
            </section>
            <section aria-label="Bookmarks">
              <p className="px-1 text-2xs font-semibold uppercase tracking-wide text-faint">
                Bookmarks
              </p>
              {refs.bookmarks.length === 0 && (
                <p className="px-1 py-1 text-2xs text-faint">No bookmarks yet.</p>
              )}
              {refs.bookmarks.map((bookmark) => (
                <button
                  key={bookmark.bookmarkId}
                  type="button"
                  className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted hover:bg-accent-subtle hover:text-ink"
                  disabled={!editor}
                  onClick={() => {
                    if (!editor) return;
                    const { pos } = bookmarkPos(editor.state.doc, bookmark.bookmarkId) ?? {};
                    if (typeof pos === 'number') jump(pos);
                  }}
                >
                  {bookmark.refLabel}
                </button>
              ))}
            </section>
            <section aria-label="Citations">
              <p className="px-1 text-2xs font-semibold uppercase tracking-wide text-faint">
                Citations
              </p>
              {refs.citations.length === 0 && (
                <p className="px-1 py-1 text-2xs text-faint">No citations yet.</p>
              )}
              {refs.citations.map((citation, index) => (
                <button
                  key={`${citation.citeKey}-${index}`}
                  type="button"
                  className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted hover:bg-accent-subtle hover:text-ink"
                  disabled={!editor}
                  onClick={() => {
                    if (!editor) return;
                    const { pos } = citationPos(editor.state.doc, index) ?? {};
                    if (typeof pos === 'number') jump(pos);
                  }}
                >
                  {`[${index + 1}] ${citation.title}`}
                </button>
              ))}
            </section>
          </div>
        )}
      </div>
      <div className="border-t border-line p-1.5">
        <button
          type="button"
          aria-label="Close right panel"
          className="w-full rounded-md px-2 py-1 text-2xs text-faint hover:bg-accent-subtle"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </aside>
  );
}

function captionPos(doc: ProsemirrorNode, cid: string): { pos: number } | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) return;
    if (node.type.name === 'caption' && String(node.attrs.cid ?? '') === cid) found = pos;
  });
  return found !== null ? { pos: found } : null;
}

function bookmarkPos(doc: ProsemirrorNode, bookmarkId: string): { pos: number } | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) return;
    if (node.type.name === 'bookmark' && String(node.attrs.bookmarkId ?? '') === bookmarkId) {
      found = pos;
    }
  });
  return found !== null ? { pos: found } : null;
}

function citationPos(doc: ProsemirrorNode, index: number): { pos: number } | null {
  let n = 0;
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) return;
    if (node.type.name === 'citation') {
      if (n === index) found = pos;
      n += 1;
    }
  });
  return found !== null ? { pos: found } : null;
}
