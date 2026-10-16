import { createEmptyGdraft, serializeGdraft } from '@gratis/file-core';
import { describe, expect, it } from 'vitest';
import { buildImportContent } from './importContent';

function findText(content: Record<string, unknown>): string {
  const found: string[] = [];
  const walk = (node: Record<string, unknown>) => {
    if (node.type === 'text' && typeof node.text === 'string') found.push(node.text);
    for (const child of (node.content as Record<string, unknown>[] | undefined) ?? []) walk(child);
  };
  walk(content);
  return found.join('');
}

describe('buildImportContent', () => {
  it('imports markdown into editor content', async () => {
    const file = new File(['# Hello\n\nSome body text'], 'notes.md', { type: 'text/markdown' });
    const result = await buildImportContent(file);
    expect(result.suggestedName).toBe('notes.gdraft');
    expect(result.content.type).toBe('doc');
    expect(findText(result.content)).toContain('Hello');
    expect(findText(result.content)).toContain('Some body text');
  });

  it('imports plain text without interpreting markup', async () => {
    const file = new File(['<b>literal</b> text'], 'plain.txt', { type: 'text/plain' });
    const result = await buildImportContent(file);
    expect(findText(result.content)).toBe('<b>literal</b> text');
  });

  it('imports html with inline marks', async () => {
    const file = new File(['<p>Hello <strong>world</strong></p>'], 'page.html', {
      type: 'text/html',
    });
    const result = await buildImportContent(file);
    expect(result.suggestedName).toBe('page.gdraft');
    expect(findText(result.content)).toBe('Hello world');
    const paragraph = (result.content.content as Record<string, unknown>[])[0];
    const runs = paragraph.content as Record<string, unknown>[];
    expect(runs[1].marks).toBeDefined();
  });

  it('imports gdraft documents and preserves createdAt', async () => {
    const doc = createEmptyGdraft('Imported');
    const file = new File([serializeGdraft(doc)], 'imported.gdraft', {
      type: 'application/json',
    });
    const result = await buildImportContent(file);
    expect(result.suggestedName).toBe('imported.gdraft');
    expect(result.createdAt).toBe(doc.meta.createdAt);
  });

  it('rejects unsupported file types', async () => {
    const file = new File(['x'], 'archive.zip', { type: 'application/zip' });
    await expect(buildImportContent(file)).rejects.toThrow(/Unsupported file type/);
  });

  it('rejects corrupt gdraft files', async () => {
    const file = new File(['not json'], 'broken.gdraft', { type: 'application/json' });
    await expect(buildImportContent(file)).rejects.toThrow();
  });
});
