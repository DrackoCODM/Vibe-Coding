export interface GdraftMeta {
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface GdraftDocument {
  version: 1;
  meta: GdraftMeta;
  /** ProseMirror/TipTap document JSON (opaque to file-core). */
  content: unknown;
}

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
}

export type ExportBlock =
  | { type: 'heading'; level: number; runs: TextRun[] }
  | { type: 'paragraph'; runs: TextRun[] }
  | { type: 'listItem'; ordered: boolean; level: number; runs: TextRun[] }
  | { type: 'blockquote'; runs: TextRun[] }
  | { type: 'horizontalRule' }
  | { type: 'tableRow'; cells: string[][] };

/** Structural shape of a ProseMirror JSON node (subset). */
export interface PmNodeLike {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PmNodeLike[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}
