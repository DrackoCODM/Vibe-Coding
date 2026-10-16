import mammoth from 'mammoth';
import {
  BorderStyle,
  Document,
  Footer,
  FootnoteReferenceRun,
  Header,
  HeadingLevel,
  PageBreak,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { ISectionOptions } from 'docx';
import type { ExportBlock, TextRun as BlockRun } from './types';

export interface DocxExportOptions {
  headerText?: string;
  footerText?: string;
  orientation?: 'portrait' | 'landscape';
  /** Notes referenced by footnoteId on runs; numbered by first-encounter order. */
  footnotes?: { id: string; text: string }[];
}

/** Convert a .docx file (ArrayBuffer) to an HTML fragment. */
export async function docxToHtml(buffer: ArrayBuffer): Promise<string> {
  // The Node build of mammoth expects `buffer`; the browser build expects `arrayBuffer`.
  const globalBuffer = (globalThis as { Buffer?: { from(data: ArrayBuffer): Uint8Array } }).Buffer;
  const input = (
    globalBuffer ? { buffer: globalBuffer.from(buffer) } : { arrayBuffer: buffer }
  ) as Parameters<typeof mammoth.convertToHtml>[0];
  const result = await mammoth.convertToHtml(input);
  return result.value;
}

type HeadingLevelValue = (typeof HeadingLevel)[keyof typeof HeadingLevel];

const HEADING_MAP: Record<number, HeadingLevelValue> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

function headingLevelFor(level: number): HeadingLevelValue {
  return HEADING_MAP[level] ?? HeadingLevel.HEADING_6;
}

/** Convert document blocks to a .docx file (returns the file bytes). */
export async function blocksToDocx(
  blocks: ExportBlock[],
  options: DocxExportOptions = {},
): Promise<Uint8Array> {
  const footnoteNumberById = new Map<string, number>();
  for (const block of blocks) {
    if (
      block.type === 'heading' ||
      block.type === 'paragraph' ||
      block.type === 'listItem' ||
      block.type === 'blockquote'
    ) {
      for (const run of block.runs) {
        if (run.footnoteId && !footnoteNumberById.has(run.footnoteId)) {
          footnoteNumberById.set(run.footnoteId, footnoteNumberById.size + 1);
        }
      }
    }
  }
  const toDocxRun = (run: BlockRun): TextRun | FootnoteReferenceRun => {
    if (run.footnoteId) {
      const number = footnoteNumberById.get(run.footnoteId) ?? footnoteNumberById.size + 1;
      return new FootnoteReferenceRun(number);
    }
    return new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italic,
      underline: run.underline ? {} : undefined,
      strike: run.strike,
      font: 'Calibri',
    });
  };

  const children: Paragraph[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        children.push(
          new Paragraph({
            heading: headingLevelFor(block.level),
            children: block.runs.map(toDocxRun),
          }),
        );
        break;
      case 'paragraph':
        children.push(new Paragraph({ children: block.runs.map(toDocxRun) }));
        break;
      case 'listItem':
        children.push(
          new Paragraph({
            children: block.runs.map(toDocxRun),
            bullet: { level: Math.min(block.level, 8) },
          }),
        );
        break;
      case 'blockquote':
        children.push(
          new Paragraph({
            children: block.runs.map(toDocxRun),
            indent: { left: 720 },
          }),
        );
        break;
      case 'pageBreak':
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      case 'horizontalRule':
        children.push(
          new Paragraph({
            text: '',
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
          }),
        );
        break;
      case 'tableRow':
        // TODO(step-6): table rows are exported as pipe-joined paragraph lines
        children.push(new Paragraph({ children: [new TextRun(block.cells.flat().join(' | '))] }));
        break;
    }
  }
  const landscape = options.orientation === 'landscape';
  const textParagraph = (text: string) =>
    new Paragraph({ children: [new TextRun({ text, font: 'Calibri' })] });
  const section: ISectionOptions = {
    properties: {
      page: {
        size: {
          width: landscape ? 16838 : 11906,
          height: landscape ? 11906 : 16838,
          orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
        },
      },
    },
    children,
    ...(options.headerText
      ? { headers: { default: new Header({ children: [textParagraph(options.headerText)] }) } }
      : {}),
    ...(options.footerText
      ? { footers: { default: new Footer({ children: [textParagraph(options.footerText)] }) } }
      : {}),
  };
  const footnotes: Record<string, { children: Paragraph[] }> = {};
  for (const [id, number] of footnoteNumberById) {
    const text = options.footnotes?.find((note) => note.id === id)?.text ?? '';
    footnotes[String(number)] = {
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri' })] })],
    };
  }
  const doc = new Document({
    sections: [section],
    ...(Object.keys(footnotes).length > 0 ? { footnotes } : {}),
  });
  return Packer.toBuffer(doc);
}
