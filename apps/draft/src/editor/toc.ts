import { Node } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

export interface TocEntry {
  text: string;
  level: number;
}

/** Collect headings in document order for the ToC entries cache. */
export function collectHeadings(doc: ProsemirrorNode): TocEntry[] {
  const entries: TocEntry[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'heading') {
      entries.push({ level: Number(node.attrs.level), text: node.textContent });
    }
  });
  return entries;
}

function entriesEqual(a: TocEntry[], b: TocEntry[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].level !== b[i].level || a[i].text !== b[i].text) return false;
  }
  return true;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toc: {
      /** Insert a table of contents block with freshly collected headings. */
      insertTableOfContents: () => ReturnType;
      /** Refresh the entries on every table of contents block. */
      updateTableOfContents: () => ReturnType;
    };
  }
}

/** Auto-generated table of contents block; entries are a cached heading list. */
export const TableOfContents = Node.create({
  name: 'toc',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      entries: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-toc]' }];
  },

  renderHTML({ node }) {
    const entries = (node.attrs.entries ?? []) as TocEntry[];
    return [
      'div',
      { 'data-toc': '', class: 'gd-toc' },
      ...entries.map((entry) => [
        'div',
        { 'data-level': String(entry.level), class: `gd-toc-row gd-toc-l${entry.level}` },
        entry.text,
      ]),
    ];
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ state, dispatch }) => {
          const node = state.schema.nodes.toc.create({ entries: collectHeadings(state.doc) });
          const tr = state.tr;
          const $from = state.selection.$from;
          // Insert after the top-level block that contains the cursor.
          const insertPos = $from.depth >= 1 ? $from.after(1) : 1;
          tr.insert(insertPos, node);
          const nextPos = Math.min(insertPos + node.nodeSize, tr.doc.content.size - 1);
          tr.setSelection(TextSelection.near(tr.doc.resolve(nextPos)));
          if (dispatch) {
            tr.scrollIntoView();
            dispatch(tr);
          }
          return true;
        },
      updateTableOfContents:
        () =>
        ({ state, dispatch }) => {
          const entries = collectHeadings(state.doc);
          let changed = false;
          const tr = state.tr;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'toc') return;
            const stale = (node.attrs.entries ?? []) as TocEntry[];
            if (!entriesEqual(stale, entries)) {
              tr.setNodeMarkup(pos, undefined, { entries });
              changed = true;
            }
          });
          if (!changed) return true;
          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
