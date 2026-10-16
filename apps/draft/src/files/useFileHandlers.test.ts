import { describe, expect, it } from 'vitest';
import { createEmptyGdraft, serializeGdraft } from '@gratis/file-core';
import { AUTOSAVE_KEY, readAutoSave, writeAutoSave } from '../files/useFileHandlers';

describe('auto-save storage', () => {
  it('round-trips a draft', () => {
    const doc = createEmptyGdraft('Recovery');
    writeAutoSave(doc);
    const restored = readAutoSave();
    expect(restored?.meta.title).toBe('Recovery');
    expect(restored?.content).toEqual(doc.content);
  });

  it('returns null when nothing was saved', () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    expect(readAutoSave()).toBeNull();
  });

  it('returns null when the stored value is corrupt', () => {
    localStorage.setItem(AUTOSAVE_KEY, 'not json at all');
    expect(readAutoSave()).toBeNull();
  });

  it('stores serialized gdraft under the autosave key', () => {
    const doc = createEmptyGdraft('Stored');
    writeAutoSave(doc);
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBe(serializeGdraft(doc));
  });
});
