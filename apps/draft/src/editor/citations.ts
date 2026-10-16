import { Node } from '@tiptap/core';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citations: {
      /** Insert an inline citation marker at the cursor. */
      insertCitation: (attrs: { citeKey: string; title: string }) => ReturnType;
      /** Insert or refresh a bibliography block. */
      insertBibliography: () => ReturnType;
      /** Refresh bibliography entries from the citations in the document. */
      updateBibliography: () => ReturnType;
    };
  }
}

/**
 * Inline citation marker, displayed as [1] via CSS counters per document order.
 */
export const Citation = Node.create({
  name: 'citation',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      citeKey: { default: '' },
      title: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation]',
        getAttrs: (element) => ({
          citeKey:
            element instanceof HTMLElement ? (element.getAttribute('data-cite-key') ?? '') : '',
          title: element instanceof HTMLElement ? (element.getAttribute('data-title') ?? '') : '',
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-citation': '',
        'data-cite-key': node.attrs.citeKey,
        'data-title': node.attrs.title,
        class: 'gd-citation',
      },
      // Static bracket content is replaced by CSS counters at render time.
      '',
    ];
  },

  addCommands() {
    return {
      insertCitation:
        (attrs) =>
        ({ tr, dispatch }) => {
          const node = this.type.create(attrs);
          tr.replaceSelectionWith(node);
          tr.scrollIntoView();
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/** Auto-listed bibliography; entries are a cached citation list. */
export const Bibliography = Node.create({
  name: 'bibliography',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      entries: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-bibliography]' }];
  },

  renderHTML({ node }) {
    const entries = (node.attrs.entries ?? []) as { citeKey: string; title: string }[];
    return [
      'div',
      { 'data-bibliography': '', class: 'gd-bibliography' },
      ['div', { class: 'gd-bibliography-title' }, 'Bibliography'],
      ...entries.map((entry) => [
        'div',
        { class: 'gd-bibliography-entry' },
        `${entry.title} (${entry.citeKey})`,
      ]),
    ];
  },

  addCommands() {
    return {
      insertBibliography:
        () =>
        ({ state, dispatch }) => {
          const node = state.schema.nodes.bibliography.create({
            entries: collectCitations(state.doc),
          });
          const tr = state.tr.insert(state.doc.content.size, node);
          tr.scrollIntoView();
          if (dispatch) dispatch(tr);
          return true;
        },
      updateBibliography:
        () =>
        ({ state, dispatch }) => {
          const entries = collectCitations(state.doc);
          let changed = false;
          const tr = state.tr;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'bibliography') return;
            const stale = (node.attrs.entries ?? []) as { citeKey: string; title: string }[];
            if (JSON.stringify(stale) !== JSON.stringify(entries)) {
              tr.setNodeMarkup(pos, undefined, { entries });
              changed = true;
            }
          });
          if (!changed) return true;
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/** Citations in document order, in the shape used for bibliography entries. */
export function collectCitations(doc: ProsemirrorNode): { citeKey: string; title: string }[] {
  const out: { citeKey: string; title: string }[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'citation') {
      out.push({
        citeKey: String(node.attrs.citeKey ?? ''),
        title: String(node.attrs.title ?? ''),
      });
    }
  });
  return out;
}
