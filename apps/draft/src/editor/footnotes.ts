import type { Editor } from '@tiptap/core';
import { Node } from '@tiptap/core';
import { DocAttrStep } from '@tiptap/pm/transform';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

/** A footnote's note text, keyed by id on the document node's footnotes attr. */
export interface FootnoteEntry {
  id: string;
  text: string;
}

function newFootnoteId(): string {
  return `fn-${crypto.randomUUID().slice(0, 8)}`;
}

/** Ordered list of footnote reference positions (document order). */
export function findFootnoteRefs(doc: ProsemirrorNode): { noteId: string; pos: number }[] {
  const refs: { noteId: string; pos: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'footnoteRef') {
      refs.push({ noteId: node.attrs.noteId as string, pos });
    }
  });
  return refs;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      /** Insert a footnote reference at the selection and register its note. */
      addFootnote: () => ReturnType;
    };
  }
}

/** Inline atomic superscript reference; numbering is cosmetic (CSS counters). */
export const FootnoteRef = Node.create({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      noteId: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]',
        getAttrs: (element) => ({
          noteId:
            element instanceof HTMLElement ? (element.getAttribute('data-footnote-id') ?? '') : '',
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return ['sup', { 'data-footnote-id': node.attrs.noteId }];
  },

  addCommands() {
    return {
      addFootnote:
        () =>
        ({ state, dispatch }) => {
          const noteId = newFootnoteId();
          const nodeType = state.schema.nodes.footnoteRef;
          if (!nodeType) return false;
          const tr = state.tr;
          tr.insert(state.selection.to, nodeType.create({ noteId }));
          const notes = (state.doc.attrs.footnotes ?? []) as FootnoteEntry[];
          tr.step(new DocAttrStep('footnotes', [...notes, { id: noteId, text: '' }]));
          if (dispatch) {
            tr.scrollIntoView();
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

/** Delete a footnote's references and its registered note in one undoable step. */
export function removeFootnote(editor: Editor, noteId: string): void {
  const { state } = editor;
  const refs = findFootnoteRefs(state.doc).filter((ref) => ref.noteId === noteId);
  const tr = state.tr;
  for (const ref of [...refs].reverse()) {
    tr.delete(ref.pos, ref.pos + 1);
  }
  const notes = (state.doc.attrs.footnotes ?? []) as FootnoteEntry[];
  tr.step(
    new DocAttrStep(
      'footnotes',
      notes.filter((note) => note.id !== noteId),
    ),
  );
  editor.view.dispatch(tr);
}
