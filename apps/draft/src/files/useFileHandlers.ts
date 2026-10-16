import type { Editor } from '@tiptap/react';
import {
  blocksToDocx,
  htmlToMarkdown,
  htmlToPlainText,
  pmJsonToBlocks,
  serializeGdraft,
  parseGdraft,
  withUpdatedAt,
  type GdraftDocument,
} from '@gratis/file-core';
import { GDRAFT_FILE_EXTENSION } from '@gratis/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { readDocSettings } from '../editor/doc';
import { buildImportContent } from './importContent';
import { downloadBlob, pickFileToOpen, pickSaveDestination } from './io';

const OPEN_ACCEPT = '.gdraft,.docx,.md,.markdown,.html,.htm,.txt,.text';
const DEFAULT_NAME = `Untitled${GDRAFT_FILE_EXTENSION}`;
export const AUTOSAVE_KEY = 'gratisdraft.autosave';
const AUTOSAVE_DELAY_MS = 5000;

/** Read the local auto-save draft, or null when missing/corrupt. */
export function readAutoSave(): GdraftDocument | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? parseGdraft(raw) : null;
  } catch {
    return null;
  }
}

/** Persist a draft to local storage (best effort). */
export function writeAutoSave(doc: GdraftDocument): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serializeGdraft(doc));
  } catch {
    // storage full or unavailable — ignore
  }
}

export interface FileHandlers {
  fileName: string;
  dirty: boolean;
  newDocument: () => void;
  open: () => Promise<void>;
  save: () => Promise<void>;
  saveAs: () => Promise<void>;
  exportAs: (format: 'docx' | 'md' | 'html' | 'txt' | 'pdf') => Promise<void>;
}

export function useFileHandlers(editor: Editor | null): FileHandlers {
  const [fileName, setFileName] = useState(DEFAULT_NAME);
  const [dirty, setDirty] = useState(false);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const metaRef = useRef<{ createdAt: string } | null>(null);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => setDirty(true);
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor]);

  const buildGdraft = useCallback((): GdraftDocument => {
    const now = new Date().toISOString();
    return {
      version: 1,
      meta: {
        title: fileName.replace(GDRAFT_FILE_EXTENSION, ''),
        createdAt: metaRef.current?.createdAt ?? now,
        updatedAt: now,
      },
      content: editor?.getJSON() ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    };
  }, [editor, fileName]);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (!editor || restoredRef.current) return;
    restoredRef.current = true;
    if (!editor.isEmpty) return;
    const saved = readAutoSave();
    if (saved) {
      editor.commands.setContent(saved.content as Record<string, unknown>);
      metaRef.current = { createdAt: saved.meta.createdAt };
      setFileName(`${saved.meta.title || 'Untitled'}${GDRAFT_FILE_EXTENSION}`);
      setDirty(false);
    }
  }, [editor]);

  const buildGdraftRef = useRef(buildGdraft);
  buildGdraftRef.current = buildGdraft;
  useEffect(() => {
    if (!editor || !dirty) return;
    const timer = setTimeout(() => {
      const doc = buildGdraftRef.current();
      writeAutoSave(doc);
      const handle = fileHandleRef.current;
      if (handle) {
        void (async () => {
          try {
            const writable = await handle.createWritable();
            await writable.write(serializeGdraft(doc));
            await writable.close();
            setDirty(false);
          } catch {
            // auto-save to file failed — keep dirty, local copy already written
          }
        })();
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dirty, editor]);

  const newDocument = useCallback(() => {
    editor?.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
    fileHandleRef.current = null;
    metaRef.current = null;
    setFileName(DEFAULT_NAME);
    setDirty(false);
  }, [editor]);

  const open = useCallback(async () => {
    if (!editor) return;
    const picked = await pickFileToOpen(OPEN_ACCEPT);
    if (!picked) return;
    try {
      const result = await buildImportContent(picked.file);
      editor.commands.setContent(result.content);
      metaRef.current = result.createdAt ? { createdAt: result.createdAt } : null;
      setFileName(result.suggestedName);
      setDirty(false);
    } catch (error) {
      window.alert(
        `Could not open file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, [editor]);

  const writeGdraftToHandle = useCallback(
    async (handle: FileSystemFileHandle) => {
      const writable = await handle.createWritable();
      await writable.write(serializeGdraft(withUpdatedAt(buildGdraft())));
      await writable.close();
      fileHandleRef.current = handle;
      setFileName(handle.name);
      setDirty(false);
    },
    [buildGdraft],
  );

  const saveAs = useCallback(async () => {
    if (!editor) return;
    const handle = await pickSaveDestination(fileName, 'GratisDraft document', 'gdraft');
    if (handle) {
      await writeGdraftToHandle(handle);
      return;
    }
    downloadBlob(
      fileName.endsWith(GDRAFT_FILE_EXTENSION) ? fileName : `${fileName}${GDRAFT_FILE_EXTENSION}`,
      new Blob([serializeGdraft(buildGdraft())], { type: 'application/json' }),
    );
    setDirty(false);
  }, [buildGdraft, editor, fileName, writeGdraftToHandle]);

  const save = useCallback(async () => {
    if (!editor) return;
    const handle = fileHandleRef.current;
    if (handle) {
      try {
        await writeGdraftToHandle(handle);
        return;
      } catch {
        // fall through to Save As
      }
    }
    await saveAs();
  }, [editor, saveAs, writeGdraftToHandle]);

  const exportAs = useCallback(
    async (format: 'docx' | 'md' | 'html' | 'txt' | 'pdf') => {
      if (!editor) return;
      const base = fileName.replace(GDRAFT_FILE_EXTENSION, '') || 'Untitled';
      if (format === 'pdf') {
        window.print();
        return;
      }
      if (format === 'md') {
        downloadBlob(
          `${base}.md`,
          new Blob([htmlToMarkdown(editor.getHTML())], { type: 'text/markdown' }),
        );
        return;
      }
      if (format === 'html') {
        const html = `<!doctype html>\n<html><head><meta charset="utf-8"><title>${base}</title></head><body>${editor.getHTML()}</body></html>`;
        downloadBlob(`${base}.html`, new Blob([html], { type: 'text/html' }));
        return;
      }
      if (format === 'txt') {
        downloadBlob(
          `${base}.txt`,
          new Blob([htmlToPlainText(editor.getHTML())], { type: 'text/plain' }),
        );
        return;
      }
      const settings = readDocSettings(editor.state.doc);
      const bytes = await blocksToDocx(pmJsonToBlocks(editor.getJSON()), {
        headerText: settings.headerText || undefined,
        footerText: settings.footerText || undefined,
        orientation: settings.orientation,
      });
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      downloadBlob(
        `${base}.docx`,
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      );
    },
    [editor, fileName],
  );

  return { fileName, dirty, newDocument, open, save, saveAs, exportAs };
}
