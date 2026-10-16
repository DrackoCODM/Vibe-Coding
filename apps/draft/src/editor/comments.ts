import { Mark } from '@tiptap/core';
import { DocAttrStep } from '@tiptap/pm/transform';
import type { Editor } from '@tiptap/react';
import type { CommentItem } from './doc';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /** Wrap the selection in a comment mark and register the comment. */
      addComment: () => ReturnType;
    };
  }
}

/** Highlight mark referencing a comment entry stored on the document node. */
export const CommentMark = Mark.create({
  name: 'comment',
  inclusive: false,
  excludes: '',

  addAttributes() {
    return {
      commentId: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
        getAttrs: (element) => ({
          commentId:
            element instanceof HTMLElement ? (element.getAttribute('data-comment-id') ?? '') : '',
        }),
      },
    ];
  },

  renderHTML({ mark }) {
    return ['span', { 'data-comment-id': mark.attrs.commentId, class: 'gd-comment' }, 0];
  },

  addCommands() {
    return {
      addComment:
        () =>
        ({ state, dispatch }) => {
          const commentId = `c-${crypto.randomUUID().slice(0, 8)}`;
          const markType = state.schema.marks.comment;
          if (!markType) return false;
          const from = state.selection.from;
          const to = state.selection.to;
          if (from === to) return false;
          const tr = state.tr;
          tr.addMark(from, to, markType.create({ commentId }));
          const comments = (state.doc.attrs.comments ?? []) as CommentItem[];
          tr.step(
            new DocAttrStep('comments', [
              ...comments,
              {
                id: commentId,
                text: '',
                author: 'Me',
                createdAt: new Date().toISOString(),
              },
            ]),
          );
          if (dispatch) {
            tr.scrollIntoView();
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

/** Delete a comment's marks from the document and its entry in one step. */
export function removeComment(editor: Editor, commentId: string): void {
  const { state } = editor;
  const tr = state.tr;
  const ranges: { from: number; to: number }[] = [];
  state.doc.descendants((node, pos) => {
    const mark = node.marks.find(
      (m) => m.type.name === 'comment' && m.attrs.commentId === commentId,
    );
    if (!mark) return;
    ranges.push({ from: pos, to: pos + node.nodeSize });
  });
  const markType = state.schema.marks.comment;
  for (const range of [...ranges].reverse()) {
    if (markType) tr.removeMark(range.from, range.to, markType);
  }
  const comments = (state.doc.attrs.comments ?? []) as CommentItem[];
  tr.step(
    new DocAttrStep(
      'comments',
      comments.filter((comment) => comment.id !== commentId),
    ),
  );
  editor.view.dispatch(tr);
}
