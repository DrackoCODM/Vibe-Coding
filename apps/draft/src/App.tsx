import type { Editor } from '@tiptap/core';
import { DRAFT_APP_NAME } from '@gratis/shared';
import { useEditor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import { useState } from 'react';
import { EditorPage } from './components/EditorPage';
import { MenuBar } from './components/MenuBar';
import { StatusBar } from './components/StatusBar';
import { ThemeToggle } from './components/ThemeToggle';
import { Toolbar } from './components/Toolbar';
import { getEditorExtensions } from './editor/extensions';
import { imageFilesFromDataTransfer, isImageFile, readFileAsDataUrl } from './editor/images';

type EditorViewWithEditor = EditorView & { editor: Editor };

async function insertImageFiles(files: File[], insert: (src: string, alt: string) => void) {
  for (const file of files) {
    if (!isImageFile(file)) continue;
    const src = await readFileAsDataUrl(file);
    insert(src, file.name);
  }
}

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: '',
    editorProps: {
      handlePaste(view, event) {
        if (!event.clipboardData) return false;
        const files = imageFilesFromDataTransfer(event.clipboardData);
        if (files.length === 0) return false;
        void insertImageFiles(files, (src, alt) => {
          (view as EditorViewWithEditor).editor.chain().focus().setImage({ src, alt }).run();
        });
        return true;
      },
      handleDrop(view, event) {
        if (!event.dataTransfer) return false;
        const files = imageFilesFromDataTransfer(event.dataTransfer);
        if (files.length === 0) return false;
        void insertImageFiles(files, (src, alt) => {
          (view as EditorViewWithEditor).editor.chain().focus().setImage({ src, alt }).run();
        });
        return true;
      },
    },
  });

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return (
    <div className="flex h-screen flex-col bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      <header className="flex items-center gap-2 border-b border-gray-300 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-900">
        <span className="text-sm font-semibold">{DRAFT_APP_NAME}</span>
        <MenuBar />
        <div className="ml-auto">
          <ThemeToggle dark={darkMode} onToggle={toggleTheme} />
        </div>
      </header>
      <Toolbar editor={editor} />
      <main className="flex-1 overflow-auto p-8">
        <EditorPage editor={editor} />
      </main>
      <StatusBar wordCount={0} />
    </div>
  );
}
