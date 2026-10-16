import { describe, expect, it } from 'vitest';
import { detectImportFormat, getFileExtension } from './index';

describe('getFileExtension', () => {
  it('extracts the extension', () => {
    expect(getFileExtension('report.gdraft')).toBe('gdraft');
  });

  it('lowercases the extension', () => {
    expect(getFileExtension('Report.DOCX')).toBe('docx');
  });

  it('returns empty string when there is no extension', () => {
    expect(getFileExtension('README')).toBe('');
  });
});

describe('detectImportFormat', () => {
  it('detects supported formats', () => {
    expect(detectImportFormat('a.gdraft')).toBe('gdraft');
    expect(detectImportFormat('a.md')).toBe('md');
    expect(detectImportFormat('a.html')).toBe('html');
  });

  it('returns null for unsupported formats', () => {
    expect(detectImportFormat('a.xyz')).toBeNull();
  });
});
