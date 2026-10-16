import type { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import { DocAttrStep } from '@tiptap/pm/transform';

export type PageOrientation = 'portrait' | 'landscape';

export interface CommentItem {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
}

export interface FootnoteNote {
  id: string;
  text: string;
}

export interface DocSettings {
  orientation: PageOrientation;
  columns: 1 | 2 | 3;
  watermarkText: string;
  headerText: string;
  footerText: string;
  footnotes: FootnoteNote[];
  comments: CommentItem[];
}

export const DEFAULT_DOC_SETTINGS: DocSettings = {
  orientation: 'portrait',
  columns: 1,
  watermarkText: '',
  headerText: '',
  footerText: '',
  footnotes: [],
  comments: [],
};

/**
 * The document node carries app-level settings (orientation, columns, watermark,
 * header/footer text, comments) as attributes so they round-trip inside the
 * ProseMirror JSON that .gdraft files store.
 */
export const GratisDoc = Document.extend({
  addAttributes() {
    return {
      orientation: { default: DEFAULT_DOC_SETTINGS.orientation },
      columns: { default: DEFAULT_DOC_SETTINGS.columns },
      watermarkText: { default: DEFAULT_DOC_SETTINGS.watermarkText },
      headerText: { default: DEFAULT_DOC_SETTINGS.headerText },
      footerText: { default: DEFAULT_DOC_SETTINGS.footerText },
      footnotes: { default: DEFAULT_DOC_SETTINGS.footnotes },
      comments: { default: DEFAULT_DOC_SETTINGS.comments },
    };
  },
});

/** Read and normalize the settings stored on the document node. */
export function readDocSettings(doc: { attrs: Record<string, unknown> }): DocSettings {
  const attrs = doc.attrs ?? {};
  return {
    orientation: attrs.orientation === 'landscape' ? 'landscape' : 'portrait',
    columns: attrs.columns === 2 || attrs.columns === 3 ? attrs.columns : 1,
    watermarkText: typeof attrs.watermarkText === 'string' ? attrs.watermarkText : '',
    headerText: typeof attrs.headerText === 'string' ? attrs.headerText : '',
    footerText: typeof attrs.footerText === 'string' ? attrs.footerText : '',
    footnotes: Array.isArray(attrs.footnotes) ? (attrs.footnotes as FootnoteNote[]) : [],
    comments: Array.isArray(attrs.comments) ? (attrs.comments as CommentItem[]) : [],
  };
}

/**
 * Update settings on the document node. TipTap's `updateAttributes` command only
 * reaches the selection's parent node and `setNodeMarkup(0)` would target the
 * first child, so the top-level doc node needs its dedicated AttrStep.
 */
export function updateDocSettings(editor: Editor, attrs: Partial<DocSettings>): void {
  const tr = editor.state.tr;
  for (const [key, value] of Object.entries(attrs)) {
    tr.step(new DocAttrStep(key, value));
  }
  editor.view.dispatch(tr);
}
