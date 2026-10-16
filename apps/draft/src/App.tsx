import type { Editor } from '@tiptap/core';
import { DRAFT_APP_NAME } from '@gratis/shared';
import { useEditor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import {
  FileDown,
  FilePlus,
  FileText,
  FolderOpen,
  Moon,
  Printer,
  Redo2,
  Replace,
  Save,
  SaveAll,
  Search,
  Sun,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EditorPage } from './components/EditorPage';
import { FindBar } from './components/FindBar';
import { MenuBar } from './components/MenuBar';
import { PageSetupBar, type PageSetup } from './components/PageSetupBar';
import { Ruler } from './components/Ruler';
import { StatusBar } from './components/StatusBar';
import { ThemeToggle } from './components/ThemeToggle';
import { Toolbar } from './components/Toolbar';
import { getEditorExtensions } from './editor/extensions';
import { DEFAULT_DOC_SETTINGS, readDocSettings, type DocSettings } from './editor/doc';
import { imageFilesFromDataTransfer, isImageFile, readFileAsDataUrl } from './editor/images';
import { countWords, getDocText, type WordStats } from './editor/stats';
import { useFileHandlers } from './files/useFileHandlers';
import { MARGIN_PRESETS } from './page/margins';
import { applyTheme, readInitialDark } from './theme';

type EditorViewWithEditor = EditorView & { editor: Editor };

const menuIconProps = { size: 13 } as const;

async function insertImageFiles(files: File[], insert: (src: string, alt: string) => void) {
  for (const file of files) {
    if (!isImageFile(file)) continue;
    const src = await readFileAsDataUrl(file);
    insert(src, file.name);
  }
}

export function App() {
  const [darkMode, setDarkMode] = useState(readInitialDark);
  const [pageSetup, setPageSetup] = useState<PageSetup>({
    pageSize: 'a4',
    marginPreset: 'normal',
    zoomPercent: 100,
  });
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [docSettings, setDocSettings] = useState<DocSettings>(DEFAULT_DOC_SETTINGS);
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: '',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Document content',
      },
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

  const files = useFileHandlers(editor);
  const [findOpen, setFindOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [stats, setStats] = useState<WordStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
  });

  useEffect(() => {
    if (!editor) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setStats(countWords(getDocText(editor.state.doc))), 200);
    };
    update();
    editor.on('update', update);
    return () => {
      clearTimeout(timer);
      editor.off('update', update);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const syncSettings = () => {
      setDocSettings((prev) => {
        const next = readDocSettings(editor.state.doc);
        return prev === next ? next : { ...prev, ...next };
      });
    };
    syncSettings();
    editor.on('update', syncSettings);
    return () => {
      editor.off('update', syncSettings);
    };
  }, [editor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      const handled = (): void => event.preventDefault();
      switch (key) {
        case 's':
          handled();
          if (event.shiftKey) void files.saveAs();
          else void files.save();
          break;
        case 'o':
          handled();
          void files.open();
          break;
        case 'n':
          handled();
          files.newDocument();
          break;
        case 'p':
          handled();
          void files.exportAs('pdf');
          break;
        case 'f':
          handled();
          setFindReplaceOpen(false);
          setFindOpen(true);
          break;
        case 'h':
          handled();
          setFindReplaceOpen(true);
          setFindOpen(true);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [files]);

  const handlePageChange = useCallback((current: number, total: number) => {
    setPageInfo((prev) =>
      prev.current === current && prev.total === total ? prev : { current, total },
    );
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  };

  useEffect(() => {
    applyTheme(darkMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menus = [
    {
      label: 'File',
      items: [
        {
          label: 'New',
          shortcut: 'Ctrl+N',
          icon: <FilePlus {...menuIconProps} />,
          onSelect: files.newDocument,
        },
        {
          label: 'Open / Import…',
          shortcut: 'Ctrl+O',
          icon: <FolderOpen {...menuIconProps} />,
          onSelect: () => void files.open(),
        },
        {
          label: 'Save',
          shortcut: 'Ctrl+S',
          icon: <Save {...menuIconProps} />,
          onSelect: () => void files.save(),
        },
        {
          label: 'Save As…',
          shortcut: 'Ctrl+Shift+S',
          icon: <SaveAll {...menuIconProps} />,
          onSelect: () => void files.saveAs(),
        },
        {
          label: 'Export as Word (.docx)',
          icon: <FileDown {...menuIconProps} />,
          onSelect: () => void files.exportAs('docx'),
        },
        {
          label: 'Export as Markdown (.md)',
          icon: <FileText {...menuIconProps} />,
          onSelect: () => void files.exportAs('md'),
        },
        {
          label: 'Export as HTML (.html)',
          icon: <FileText {...menuIconProps} />,
          onSelect: () => void files.exportAs('html'),
        },
        {
          label: 'Export as Plain text (.txt)',
          icon: <FileText {...menuIconProps} />,
          onSelect: () => void files.exportAs('txt'),
        },
        {
          label: 'Export as PDF (print)',
          shortcut: 'Ctrl+P',
          icon: <Printer {...menuIconProps} />,
          onSelect: () => void files.exportAs('pdf'),
        },
      ],
    },
    {
      label: 'Edit',
      items: [
        {
          label: 'Find',
          shortcut: 'Ctrl+F',
          icon: <Search {...menuIconProps} />,
          onSelect: () => {
            setFindReplaceOpen(false);
            setFindOpen(true);
          },
        },
        {
          label: 'Replace',
          shortcut: 'Ctrl+H',
          icon: <Replace {...menuIconProps} />,
          onSelect: () => {
            setFindReplaceOpen(true);
            setFindOpen(true);
          },
        },
        {
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          icon: <Undo2 {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().undo().run(),
        },
        {
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          icon: <Redo2 {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().redo().run(),
        },
      ],
    },
    {
      label: 'View',
      items: [
        {
          label: darkMode ? 'Light theme' : 'Dark theme',
          icon: darkMode ? <Sun {...menuIconProps} /> : <Moon {...menuIconProps} />,
          onSelect: toggleTheme,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-surface text-ink">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-raised px-3">
        <span className="text-xs font-semibold tracking-tight">{DRAFT_APP_NAME}</span>
        <span className="max-w-64 truncate text-xs text-muted">
          {files.fileName}
          {files.dirty ? ' *' : ''}
        </span>
        <MenuBar menus={menus} />
        <div className="ml-auto">
          <ThemeToggle dark={darkMode} onToggle={toggleTheme} />
        </div>
      </header>
      <Toolbar editor={editor} />
      <FindBar
        editor={editor}
        open={findOpen}
        showReplace={findReplaceOpen}
        onClose={() => setFindOpen(false)}
      />
      <PageSetupBar
        setup={pageSetup}
        settings={docSettings}
        editor={editor}
        onChange={setPageSetup}
      />
      <Ruler
        pageSize={pageSetup.pageSize}
        margins={MARGIN_PRESETS[pageSetup.marginPreset]}
        zoomPercent={pageSetup.zoomPercent}
        orientation={docSettings.orientation}
      />
      <main className="flex-1 overflow-auto p-8">
        <EditorPage
          editor={editor}
          pageSize={pageSetup.pageSize}
          margins={MARGIN_PRESETS[pageSetup.marginPreset]}
          zoomPercent={pageSetup.zoomPercent}
          orientation={docSettings.orientation}
          columns={docSettings.columns}
          watermarkText={docSettings.watermarkText}
          onPageChange={handlePageChange}
        />
      </main>
      <StatusBar
        wordCount={stats.words}
        charCount={stats.characters}
        currentPage={pageInfo.current}
        pageCount={pageInfo.total}
        zoomPercent={pageSetup.zoomPercent}
      />
    </div>
  );
}
