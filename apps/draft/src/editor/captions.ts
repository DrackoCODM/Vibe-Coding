import { Node } from '@tiptap/core';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

export const CAPTION_LABELS = ['Figure', 'Table'] as const;
export type CaptionLabel = (typeof CAPTION_LABELS)[number];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    caption: {
      /** Insert a numbered caption block at the cursor. */
      insertCaption: (label: CaptionLabel) => ReturnType;
    };
  }
}

/** An editable caption block; numbering is rendered via CSS counters. */
export const Caption = Node.create({
  name: 'caption',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      label: { default: 'Figure' },
      cid: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-caption]' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-caption': '',
        'data-label': node.attrs.label,
        'data-cid': node.attrs.cid,
        class: 'gd-caption',
      },
      0,
    ];
  },

  addCommands() {
    return {
      insertCaption:
        (label) =>
        ({ commands }) => {
          const cid = `cap-${crypto.randomUUID().slice(0, 8)}`;
          return commands.insertContent({
            type: 'caption',
            attrs: { label, cid },
          });
        },
    };
  },
});

/** All captions in document order with their ids and labels. */
export function findCaptions(doc: ProsemirrorNode): { cid: string; label: string }[] {
  const out: { cid: string; label: string }[] = [];
  doc.descendants((node) => {
    if (node.type.name === 'caption') {
      out.push({ cid: String(node.attrs.cid ?? ''), label: String(node.attrs.label ?? 'Figure') });
    }
  });
  return out;
}
