import { act, renderHook } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { createEmptyGdraft, parseGdraft, serializeGdraft } from '@gratis/file-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEditorExtensions } from '../editor/extensions';
import { readBlobText } from './blobText';
import { AUTOSAVE_KEY, readAutoSave, useFileHandlers, writeAutoSave } from './useFileHandlers';

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

describe('useFileHandlers', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).showSaveFilePicker;
    localStorage.removeItem(AUTOSAVE_KEY);
    vi.restoreAllMocks();
  });

  function makeEditor(content = '<p>hello world</p>') {
    editor = new Editor({ extensions: getEditorExtensions(), content });
    return editor;
  }

  function fakeHandle(name = 'MyDoc.gdraft') {
    const writes: string[] = [];
    return {
      name,
      writes,
      createWritable: async () => ({
        write: async (data: string) => {
          writes.push(String(data));
        },
        close: async () => {},
      }),
    };
  }

  it('saveAs writes a gdraft through showSaveFilePicker when available', async () => {
    const handle = fakeHandle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue(handle);
    makeEditor('<p>saved content</p>');
    const { result } = renderHook(() => useFileHandlers(editor));

    await act(async () => {
      await result.current.saveAs();
    });

    expect(handle.writes).toHaveLength(1);
    const parsed = parseGdraft(handle.writes[0]);
    expect(parsed.version).toBe(1);
    expect(result.current.fileName).toBe('MyDoc.gdraft');
    expect(result.current.dirty).toBe(false);
  });

  it('save reuses the existing handle without prompting again', async () => {
    const handle = fakeHandle();
    const picker = vi.fn().mockResolvedValue(handle);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).showSaveFilePicker = picker;
    makeEditor('<p>first save</p>');
    const { result } = renderHook(() => useFileHandlers(editor));

    await act(async () => {
      await result.current.saveAs();
    });
    picker.mockClear();
    handle.writes.length = 0;

    await act(async () => {
      editor.commands.setContent('<p>second save</p>');
    });
    await act(async () => {
      await result.current.save();
    });

    expect(picker).not.toHaveBeenCalled();
    expect(handle.writes).toHaveLength(1);
    expect(handle.writes[0]).toContain('second save');
  });

  it('newDocument resets the title and clears dirty state', async () => {
    makeEditor('<p>temporary</p>');
    const { result } = renderHook(() => useFileHandlers(editor));
    await act(async () => {
      result.current.newDocument();
    });
    expect(result.current.fileName).toBe('Untitled.gdraft');
    expect(result.current.dirty).toBe(false);
    expect(editor.isEmpty).toBe(true);
  });

  it('exports markdown through a download blob', async () => {
    const createObjectURL = vi.fn((blob: Blob): string => {
      void blob;
      return 'blob:mock';
    });
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    makeEditor('<h1>Title</h1><p>Body text</p>');
    const { result } = renderHook(() => useFileHandlers(editor));

    await act(async () => {
      await result.current.exportAs('md');
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('text/markdown');
    const text = await readBlobText(blob);
    expect(text).toContain('# Title');
    expect(text).toContain('Body text');
  });

  it('exports plain text without html tags', async () => {
    const createObjectURL = vi.fn((blob: Blob): string => {
      void blob;
      return 'blob:mock';
    });
    URL.createObjectURL = createObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    makeEditor('<p>plain <strong>content</strong></p>');
    const { result } = renderHook(() => useFileHandlers(editor));

    await act(async () => {
      await result.current.exportAs('txt');
    });

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await readBlobText(blob)).toBe('plain content');
  });
});
