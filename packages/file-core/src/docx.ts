import mammoth from 'mammoth';
import { BorderStyle, Document, HeadingLevel, Packer, PageBreak, Paragraph, TextRun } from 'docx';
import type { ExportBlock, TextRun as BlockRun } from './types';

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

function toDocxRuns(runs: BlockRun[]): TextRun[] {
  return runs.map(
    (run) =>
      new TextRun({
        text: run.text,
        bold: run.bold,
        italics: run.italic,
        underline: run.underline ? {} : undefined,
        strike: run.strike,
        font: 'Calibri',
      }),
  );
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
export async function blocksToDocx(blocks: ExportBlock[]): Promise<Uint8Array> {
  const children: Paragraph[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        children.push(
          new Paragraph({
            heading: headingLevelFor(block.level),
            children: toDocxRuns(block.runs),
          }),
        );
        break;
      case 'paragraph':
        children.push(new Paragraph({ children: toDocxRuns(block.runs) }));
        break;
      case 'listItem':
        children.push(
          new Paragraph({
            children: toDocxRuns(block.runs),
            bullet: { level: Math.min(block.level, 8) },
          }),
        );
        break;
      case 'blockquote':
        children.push(
          new Paragraph({
            children: toDocxRuns(block.runs).map((run) => run),
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
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
