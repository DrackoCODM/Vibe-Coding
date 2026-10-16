export type SupportedImportFormat = 'gdraft' | 'docx' | 'txt' | 'md' | 'html';
export type SupportedExportFormat = 'gdraft' | 'docx' | 'txt' | 'md' | 'html' | 'pdf';

const EXTENSION_MAP: Record<string, SupportedImportFormat> = {
  gdraft: 'gdraft',
  docx: 'docx',
  txt: 'txt',
  text: 'txt',
  md: 'md',
  markdown: 'md',
  html: 'html',
  htm: 'html',
};

/** Extract the lowercase file extension without the dot, or an empty string. */
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) return '';
  return fileName.slice(dot + 1).toLowerCase();
}

/** Map a file name to a supported import format, or null if unsupported. */
export function detectImportFormat(fileName: string): SupportedImportFormat | null {
  return EXTENSION_MAP[getFileExtension(fileName)] ?? null;
}
