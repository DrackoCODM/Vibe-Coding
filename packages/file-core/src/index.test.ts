import { inflateRawSync } from 'node:zlib';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { describe, expect, it } from 'vitest';
import {
  blocksToDocx,
  createEmptyGdraft,
  detectImportFormat,
  docxToHtml,
  getFileExtension,
  htmlToMarkdown,
  htmlToPlainText,
  markdownToHtml,
  parseGdraft,
  plainTextToHtml,
  pmJsonToBlocks,
  serializeGdraft,
  type PmNodeLike,
} from './index';

/** Minimal zip reader: return the uncompressed text of one stored/deflated entry. */
function readZipEntry(bytes: Uint8Array, targetName: string): string {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset < buf.length - 4) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const nameLength = buf.readUInt16LE(offset + 26);
    const extraLength = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const dataStart = offset + 30 + nameLength + extraLength;
    if (name === targetName) {
      const data = buf.subarray(dataStart, dataStart + compressedSize);
      return method === 0 ? data.toString('utf8') : inflateRawSync(data).toString('utf8');
    }
    offset = dataStart + compressedSize;
  }
  throw new Error(`Zip entry not found: ${targetName}`);
}

describe('.gdraft', () => {
  it('round-trips a document', () => {
    const doc = createEmptyGdraft('My Doc');
    const parsed = parseGdraft(serializeGdraft(doc));
    expect(parsed.meta.title).toBe('My Doc');
    expect(parsed.content).toEqual(doc.content);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseGdraft('not json')).toThrow(/not valid JSON/);
  });

  it('rejects unsupported versions', () => {
    expect(() => parseGdraft(JSON.stringify({ version: 99, content: {} }))).toThrow(/version/);
  });

  it('rejects missing content', () => {
    expect(() => parseGdraft(JSON.stringify({ version: 1 }))).toThrow(/content/);
  });
});

describe('markdown', () => {
  it('converts markdown to html', () => {
    expect(markdownToHtml('# Hello')).toContain('<h1');
    expect(markdownToHtml('**bold**')).toContain('<strong>');
  });

  it('converts html to markdown', () => {
    expect(htmlToMarkdown('<h1>Hello</h1>')).toContain('# Hello');
    expect(htmlToMarkdown('<p><strong>bold</strong></p>')).toContain('**bold**');
  });

  it('round-trips simple content', () => {
    const md = '# Title\n\nSome **bold** text.';
    const back = htmlToMarkdown(markdownToHtml(md));
    expect(back).toContain('# Title');
    expect(back).toContain('**bold**');
  });
});

describe('plain text', () => {
  it('converts html to plain text', () => {
    expect(htmlToPlainText('<p>Hello</p><p>World</p>')).toBe('Hello\n\nWorld');
  });

  it('converts plain text to html paragraphs', () => {
    expect(plainTextToHtml('Hello\n\nWorld')).toBe('<p>Hello</p><p>World</p>');
  });

  it('escapes html in plain text import', () => {
    expect(plainTextToHtml('<script>')).toContain('&lt;script&gt;');
  });
});

describe('docx', () => {
  it('exports blocks to a valid docx buffer', async () => {
    const bytes = await blocksToDocx([
      { type: 'heading', level: 1, runs: [{ text: 'Title', bold: true }] },
      {
        type: 'paragraph',
        runs: [
          { text: 'Hello ', bold: false },
          { text: 'world', italic: true },
        ],
      },
      { type: 'listItem', ordered: false, level: 0, runs: [{ text: 'item one' }] },
    ]);
    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it('exports page breaks as explicit breaks', async () => {
    const bytes = await blocksToDocx([
      { type: 'paragraph', runs: [{ text: 'Page one' }] },
      { type: 'pageBreak' },
      { type: 'paragraph', runs: [{ text: 'Page two' }] },
    ]);
    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(bytes[0]).toBe(0x50);
  });

  it('exports orientation and header/footer text into the section', async () => {
    const bytes = await blocksToDocx([{ type: 'paragraph', runs: [] }], {
      orientation: 'landscape',
      headerText: 'Confidential',
      footerText: 'Acme Corp',
    });
    const documentXml = readZipEntry(bytes, 'word/document.xml');
    const headerXml = readZipEntry(bytes, 'word/header1.xml');
    const footerXml = readZipEntry(bytes, 'word/footer1.xml');
    expect(headerXml).toContain('Confidential');
    expect(footerXml).toContain('Acme Corp');
    expect(documentXml).toContain('orient="landscape"');
  });

  it('imports a docx fixture to html', async () => {
    const fixture = new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Fixture')] }),
            new Paragraph({ children: [new TextRun('Body text')] }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(fixture);
    const bytes = new Uint8Array(buffer);
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const html = await docxToHtml(arrayBuffer);
    expect(html).toContain('Fixture');
    expect(html).toContain('Body text');
  });
});

describe('pmJsonToBlocks', () => {
  it('converts headings, paragraphs and marks', () => {
    const doc: PmNodeLike = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Head' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Bold' },
            { type: 'text', text: ' plain' },
          ],
        },
      ],
    };
    const blocks = pmJsonToBlocks(doc);
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 2 });
    expect(blocks[1]).toMatchObject({
      type: 'paragraph',
      runs: [
        { text: 'Bold', bold: true },
        { text: ' plain', bold: false },
      ],
    });
  });

  it('converts lists to list items', () => {
    const doc: PmNodeLike = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
            },
          ],
        },
      ],
    };
    const blocks = pmJsonToBlocks(doc);
    expect(blocks[0]).toMatchObject({ type: 'listItem', ordered: false, level: 0 });
  });

  it('converts footnote references to footnote runs', () => {
    const doc: PmNodeLike = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Text ' },
            { type: 'footnoteRef', attrs: { noteId: 'fn-1' } },
            { type: 'text', text: 'more' },
          ],
        },
      ],
    };
    const blocks = pmJsonToBlocks(doc);
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        runs: [
          {
            text: 'Text ',
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
          },
          { text: '', footnoteId: 'fn-1' },
          {
            text: 'more',
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
          },
        ],
      },
    ]);
  });
});

describe('docx footnotes', () => {
  it('exports footnote references with note text', async () => {
    const bytes = await blocksToDocx(
      [
        {
          type: 'paragraph',
          runs: [{ text: 'Text', footnoteId: 'fn-1' }],
        },
      ],
      { footnotes: [{ id: 'fn-1', text: 'The note body' }] },
    );
    const footnotesXml = readZipEntry(bytes, 'word/footnotes.xml');
    const documentXml = readZipEntry(bytes, 'word/document.xml');
    expect(footnotesXml).toContain('The note body');
    expect(documentXml).toContain('footnoteReference');
  });
});

describe('captions and cross-references', () => {
  it('converts captions and cross-references to blocks', () => {
    const doc: PmNodeLike = {
      type: 'doc',
      content: [
        {
          type: 'caption',
          attrs: { label: 'Figure', cid: 'cap-1' },
          content: [{ type: 'text', text: 'Project diagram' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'As shown in ' },
            {
              type: 'crossRef',
              attrs: { refType: 'figure', refId: 'cap-1', refLabel: 'Figure 1' },
            },
          ],
        },
      ],
    };
    const blocks = pmJsonToBlocks(doc);
    expect(blocks).toEqual([
      {
        type: 'caption',
        label: 'Figure',
        runs: [
          {
            text: 'Project diagram',
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
          },
        ],
      },
      {
        type: 'paragraph',
        runs: [
          {
            text: 'As shown in ',
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
          },
          { text: 'Figure 1', underline: true },
        ],
      },
    ]);
  });

  it('numbers captions per label in the docx export', async () => {
    const bytes = await blocksToDocx([
      { type: 'caption', label: 'Figure', runs: [{ text: 'First figure', italic: true }] },
      { type: 'caption', label: 'Table', runs: [{ text: 'First table' }] },
      { type: 'caption', label: 'Figure', runs: [{ text: 'Second figure' }] },
    ]);
    const xml = readZipEntry(bytes, 'word/document.xml');
    expect(xml).toContain('Figure 1: ');
    expect(xml).toContain('Table 1: ');
    expect(xml).toContain('Figure 2: ');
  });
});

describe('file detection', () => {
  it('detects supported formats', () => {
    expect(detectImportFormat('a.gdraft')).toBe('gdraft');
    expect(detectImportFormat('a.docx')).toBe('docx');
    expect(detectImportFormat('a.DOCX')).toBe('docx');
    expect(detectImportFormat('a.xyz')).toBeNull();
    expect(getFileExtension('a.tar.gdraft')).toBe('gdraft');
  });
});
