import { generateJSON } from '@tiptap/html';
import {
  detectImportFormat,
  docxToHtml,
  markdownToHtml,
  parseGdraft,
  plainTextToHtml,
  type SupportedImportFormat,
} from '@gratis/file-core';
import { GDRAFT_FILE_EXTENSION } from '@gratis/shared';
import { getEditorExtensions } from '../editor/extensions';
import { readBlobArrayBuffer, readBlobText } from './blobText';

export interface ImportResult {
  content: Record<string, unknown>;
  suggestedName: string;
  createdAt?: string;
}

/** Detect the format of `file` and build editor content plus a suggested file name. */
export async function buildImportContent(file: File): Promise<ImportResult> {
  const format = detectImportFormat(file.name);
  if (!format) throw new Error(`Unsupported file type: ${file.name}`);
  return buildImportContentForFormat(format, file.name, file);
}

/** Build editor content for an already-detected format. */
export async function buildImportContentForFormat(
  format: SupportedImportFormat,
  name: string,
  file: File,
): Promise<ImportResult> {
  if (format === 'gdraft') {
    const doc = parseGdraft(await readBlobText(file));
    return {
      content: doc.content as Record<string, unknown>,
      suggestedName: name,
      createdAt: doc.meta.createdAt,
    };
  }
  let html: string;
  if (format === 'docx') {
    html = await docxToHtml(await readBlobArrayBuffer(file));
  } else if (format === 'md') {
    html = markdownToHtml(await readBlobText(file));
  } else if (format === 'html') {
    html = await readBlobText(file);
  } else {
    html = plainTextToHtml(await readBlobText(file));
  }
  const content = generateJSON(html, getEditorExtensions()) as Record<string, unknown>;
  const base = name.replace(/\.[^.]+$/, '');
  return { content, suggestedName: `${base}${GDRAFT_FILE_EXTENSION}` };
}
