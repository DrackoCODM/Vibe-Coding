import { Node, type Editor } from '@tiptap/core';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

export type CrossRefType = 'bookmark' | 'figure' | 'table';

/** Render label used for a cross-reference target. */
export type RefTarget = { id: string; refType: CrossRefType; refLabel: string };

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bookmark: {
      /** Insert a named bookmark anchor at the cursor. */
      insertBookmark: () => ReturnType;
      /** Insert a cross-reference to a bookmark/caption target. */
      insertCrossRef: (refType: CrossRefType, refId: string) => ReturnType;
    };
  }
}

/** An inline bookmark anchor with a stable auto-generated label. */
export const Bookmark = Node.create({
  name: 'bookmark',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      bookmarkId: { default: '' },
      refLabel: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-bookmark-id]',
        getAttrs: (element) => ({
          bookmarkId:
            element instanceof HTMLElement ? (element.getAttribute('data-bookmark-id') ?? '') : '',
          refLabel:
            element instanceof HTMLElement ? (element.getAttribute('data-ref-label') ?? '') : '',
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-bookmark-id': node.attrs.bookmarkId,
        'data-ref-label': node.attrs.refLabel,
        class: 'gd-bookmark',
      },
      String(node.attrs.refLabel ?? ''),
    ];
  },

  addCommands() {
    return {
      insertBookmark:
        () =>
        ({ state, dispatch, tr }) => {
          const existing = findBookmarks(state.doc);
          const refLabel = `bm${existing.length + 1}`;
          const bookmarkId = `bm-${crypto.randomUUID().slice(0, 8)}`;
          const node = state.schema.nodes.bookmark.create({ bookmarkId, refLabel });
          tr.replaceSelectionWith(node);
          tr.scrollIntoView();
          if (dispatch) dispatch(tr);
          return true;
        },
      insertCrossRef:
        (refType, refId) =>
        ({ state, dispatch, tr }) => {
          const target = resolveRefTarget(state.doc, refType, refId);
          if (!target) return false;
          const node = state.schema.nodes.crossRef.create({
            refId,
            refType,
            refLabel: target.refLabel,
          });
          tr.replaceSelectionWith(node);
          tr.scrollIntoView();
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/** An inline cross-reference; its label is refreshed by updateCrossRefs. */
export const CrossRef = Node.create({
  name: 'crossRef',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      refId: { default: '' },
      refType: { default: 'bookmark' },
      refLabel: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-xref]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return {};
          const refType = element.getAttribute('data-ref-type');
          return {
            refId: element.getAttribute('data-ref-id') ?? '',
            refType: refType ?? 'bookmark',
            refLabel: element.getAttribute('data-ref-label') ?? '',
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-xref': '',
        'data-ref-id': node.attrs.refId,
        'data-ref-type': node.attrs.refType,
        'data-ref-label': node.attrs.refLabel,
        class: 'gd-xref',
      },
      String(node.attrs.refLabel ?? ''),
    ];
  },
});

/** Bookmark nodes in document order. */
export function findBookmarks(doc: ProsemirrorNode): { bookmarkId: string; refLabel: string }[] {
  const out: { bookmarkId: string; refLabel: string }[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'bookmark') {
      out.push({
        bookmarkId: String(node.attrs.bookmarkId ?? ''),
        refLabel: String(node.attrs.refLabel ?? ''),
      });
    }
  });
  return out;
}

/** Resolve the current display label for a cross-reference target. */
export function resolveRefTarget(
  doc: ProsemirrorNode,
  refType: CrossRefType,
  refId: string,
): RefTarget | null {
  if (refType === 'bookmark') {
    const bookmark = findBookmarks(doc).find((b) => b.bookmarkId === refId);
    return bookmark ? { id: refId, refType, refLabel: bookmark.refLabel } : null;
  }
  // figure / table: numbered captions, in document order.
  let n = 0;
  let resolved: string | null = null;
  const labelName = refType === 'figure' ? 'Figure' : 'Table';
  doc.descendants((node) => {
    if (node.type.name === 'caption' && String(node.attrs.label ?? '') === labelName) {
      n += 1;
      if (String(node.attrs.cid ?? '') === refId) {
        resolved = `${labelName} ${n}`;
      }
    }
  });
  if (resolved) return { id: refId, refType, refLabel: resolved };
  return null;
}

/** Refresh every cross-reference label; dispatches only when something is stale. */
export function updateCrossRefs(editor: Editor): void {
  const doc = editor.state.doc;
  const tr = editor.state.tr;
  let changed = false;
  doc.descendants((node, pos) => {
    if (node.type.name !== 'crossRef') return;
    const refType = String(node.attrs.refType ?? 'bookmark') as CrossRefType;
    const refId = String(node.attrs.refId ?? '');
    const target = resolveRefTarget(doc, refType, refId);
    if (!target) return;
    if (String(node.attrs.refLabel ?? '') !== target.refLabel) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, refLabel: target.refLabel });
      changed = true;
    }
  });
  if (changed) editor.view.dispatch(tr);
}
