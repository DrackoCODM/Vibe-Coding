import { describe, expect, it } from 'vitest';
import { imageFilesFromDataTransfer, isImageFile } from './images';

describe('isImageFile', () => {
  it('accepts image mime types', () => {
    expect(isImageFile(new File([''], 'a.png', { type: 'image/png' }))).toBe(true);
  });

  it('rejects non-image files', () => {
    expect(isImageFile(new File([''], 'a.txt', { type: 'text/plain' }))).toBe(false);
  });
});

describe('imageFilesFromDataTransfer', () => {
  it('extracts only image files', () => {
    const image = new File([''], 'a.png', { type: 'image/png' });
    const text = new File([''], 'a.txt', { type: 'text/plain' });
    const data = { files: [image, text] } as unknown as DataTransfer;
    expect(imageFilesFromDataTransfer(data)).toEqual([image]);
  });

  it('returns empty array when no files', () => {
    const data = { files: [] } as unknown as DataTransfer;
    expect(imageFilesFromDataTransfer(data)).toEqual([]);
  });
});
