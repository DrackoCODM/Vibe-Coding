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
