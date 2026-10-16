import { generateJSON } from '@tiptap/html';
import type { Editor } from '@tiptap/react';
import {
  blocksToDocx,
  detectImportFormat,
  docxToHtml,
  htmlToMarkdown,
  htmlToPlainText,
  markdownToHtml,
  parseGdraft,
  plainTextToHtml,
  pmJsonToBlocks,
  serializeGdraft,
  withUpdatedAt,
  type GdraftDocument,
} from '@gratis/file-core';
import { GDRAFT_FILE_EXTENSION } from '@gratis/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getEditorExtensions } from '../editor/extensions';
import { downloadBlob, pickFileToOpen, pickSaveDestination } from './io';

const OPEN_ACCEPT = '.gdraft,.docx,.md,.markdown,.html,.htm,.txt,.text';
const DEFAULT_NAME = `Untitled${GDRAFT_FILE_EXTENSION}`;

async function fileToText(file: File): Promise<string> {
  return file.text();
}

function readFileBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

function contentFromHtml(html: string): Record<string, unknown> {
  return generateJSON(html, getEditorExtensions()) as Record<string, unknown>;
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
    const format = detectImportFormat(picked.name);
    if (!format) {
      window.alert(`Unsupported file type: ${picked.name}`);
      return;
    }
    try {
      if (format === 'gdraft') {
        const doc = parseGdraft(await fileToText(picked.file));
        editor.commands.setContent(doc.content as Record<string, unknown>);
        metaRef.current = { createdAt: doc.meta.createdAt };
        setFileName(picked.name);
      } else if (format === 'docx') {
        const html = await docxToHtml(await readFileBuffer(picked.file));
        editor.commands.setContent(contentFromHtml(html));
        metaRef.current = null;
        setFileName(picked.name.replace(/\.docx$/i, GDRAFT_FILE_EXTENSION));
      } else if (format === 'md') {
        const html = markdownToHtml(await fileToText(picked.file));
        editor.commands.setContent(contentFromHtml(html));
        metaRef.current = null;
        setFileName(picked.name.replace(/\.md$/i, GDRAFT_FILE_EXTENSION));
      } else if (format === 'html') {
        const html = await fileToText(picked.file);
        editor.commands.setContent(contentFromHtml(html));
        metaRef.current = null;
        setFileName(picked.name.replace(/\.html?$/i, GDRAFT_FILE_EXTENSION));
      } else {
        const html = plainTextToHtml(await fileToText(picked.file));
        editor.commands.setContent(contentFromHtml(html));
        metaRef.current = null;
        setFileName(picked.name.replace(/\.txt$/i, GDRAFT_FILE_EXTENSION));
      }
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
      const bytes = await blocksToDocx(pmJsonToBlocks(editor.getJSON()));
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
