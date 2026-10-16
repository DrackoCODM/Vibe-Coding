import type { Editor } from '@tiptap/core';
import { DRAFT_APP_NAME } from '@gratis/shared';
import { useEditor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import {
  Bold,
  Bookmark,
  FileDown,
  FilePlus,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Italic,
  Link2,
  ListEnd,
  ListTree,
  MessageSquare,
  Minus,
  Moon,
  PanelTop,
  Printer,
  Redo2,
  Replace,
  Save,
  SaveAll,
  Search,
  SeparatorHorizontal as SepIcon,
  Subscript as SubscriptIcon,
  Sun,
  Table as TableIcon,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutDialog } from './components/AboutDialog';
import { EditorPage } from './components/EditorPage';
import { FindBar } from './components/FindBar';
import { CommentsDialog } from './components/CommentsDialog';
import { CharacterDialog } from './components/CharacterDialog';
import { CrossRefDialog } from './components/CrossRefDialog';
import { FootnotesDialog } from './components/FootnotesDialog';
import { HeaderFooterDialog } from './components/HeaderFooterDialog';
import { MenuBar } from './components/MenuBar';
import { PageSetupBar, type PageSetup } from './components/PageSetupBar';
import { Ruler } from './components/Ruler';
import { StatusBar } from './components/StatusBar';
import { ThemeToggle } from './components/ThemeToggle';
import { Toolbar } from './components/Toolbar';
import { getEditorExtensions } from './editor/extensions';
import { updateCrossRefs } from './editor/bookmarks';
import {
  DEFAULT_DOC_SETTINGS,
  readDocSettings,
  updateDocSettings,
  type DocSettings,
} from './editor/doc';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
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
  const [headerFooterOpen, setHeaderFooterOpen] = useState(false);
  const [footnotesOpen, setFootnotesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [crossRefOpen, setCrossRefOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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
    if (!editor) return;
    // Keeps ToC blocks and cross-reference labels in sync; dispatches only
    // when their cached data is stale, so this cannot loop.
    const updateDerived = () => {
      editor.commands.updateTableOfContents();
      updateCrossRefs(editor);
    };
    updateDerived();
    editor.on('update', updateDerived);
    return () => {
      editor.off('update', updateDerived);
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
        { label: 'sep-find', separator: true, onSelect: () => undefined },
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
      label: 'Insert',
      items: [
        {
          label: 'Page break',
          icon: <SepIcon {...menuIconProps} />,
          onSelect: () => editor?.commands.setPageBreak(),
        },
        {
          label: 'Horizontal rule',
          icon: <Minus {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().setHorizontalRule().run(),
        },
        {
          label: 'Image',
          icon: <ImageIcon {...menuIconProps} />,
          onSelect: () => imageInputRef.current?.click(),
        },
        {
          label: 'Table',
          icon: <TableIcon {...menuIconProps} />,
          onSelect: () =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
        },
        { label: 'sep-last', separator: true, onSelect: () => undefined },
        {
          label: 'Table of contents',
          icon: <ListTree {...menuIconProps} />,
          onSelect: () => editor?.commands.insertTableOfContents(),
        },
        {
          label: 'Figure caption',
          icon: <ImageIcon {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().insertCaption('Figure').run(),
        },
        {
          label: 'Table caption',
          icon: <TableIcon {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().insertCaption('Table').run(),
        },
        {
          label: 'Bookmark',
          icon: <Bookmark {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().insertBookmark().run(),
        },
        {
          label: 'Cross-reference…',
          icon: <Link2 {...menuIconProps} />,
          onSelect: () => setCrossRefOpen(true),
        },
        { label: 'sep-head', separator: true, onSelect: () => undefined },
        {
          label: 'Header and footer…',
          icon: <PanelTop {...menuIconProps} />,
          onSelect: () => setHeaderFooterOpen(true),
        },
        {
          label: 'Add footnote',
          icon: <SubscriptIcon {...menuIconProps} />,
          onSelect: () => editor?.commands.addFootnote(),
        },
        {
          label: 'Footnotes…',
          icon: <ListEnd {...menuIconProps} />,
          onSelect: () => setFootnotesOpen(true),
        },
        { label: 'sep-comments', separator: true, onSelect: () => undefined },
        {
          label: 'Comments…',
          icon: <MessageSquare {...menuIconProps} />,
          onSelect: () => setCommentsOpen(true),
        },
      ],
    },
    {
      label: 'Format',
      items: [
        {
          label: 'Character formatting…',
          icon: <Type {...menuIconProps} />,
          onSelect: () => setCharacterOpen(true),
        },
        { label: 'sep-fmt', separator: true, onSelect: () => undefined },
        {
          label: 'Bold',
          shortcut: 'Ctrl+B',
          icon: <Bold {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().toggleBold().run(),
        },
        {
          label: 'Italic',
          shortcut: 'Ctrl+I',
          icon: <Italic {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().toggleItalic().run(),
        },
        {
          label: 'Underline',
          shortcut: 'Ctrl+U',
          icon: <Underline {...menuIconProps} />,
          onSelect: () => editor?.chain().focus().toggleUnderline().run(),
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
    {
      label: 'Help',
      items: [
        {
          label: 'About Project Gratis',
          icon: <Info {...menuIconProps} />,
          onSelect: () => setAboutOpen(true),
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen flex-col bg-surface text-ink">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        data-testid="image-input"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          event.currentTarget.value = '';
          if (!editor || files.length === 0) return;
          void insertImageFiles(files, (src, alt) =>
            editor.chain().focus().setImage({ src, alt }).run(),
          );
        }}
      />
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
          headerText={docSettings.headerText}
          footerText={docSettings.footerText}
          footnotes={docSettings.footnotes}
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
      <HeaderFooterDialog
        open={headerFooterOpen}
        settings={docSettings}
        onApply={(headerText, footerText) => {
          if (editor) updateDocSettings(editor, { headerText, footerText });
          setHeaderFooterOpen(false);
        }}
        onClose={() => setHeaderFooterOpen(false)}
      />
      <FootnotesDialog
        editor={editor}
        open={footnotesOpen}
        footnotes={docSettings.footnotes}
        onApply={(items) => {
          if (editor) updateDocSettings(editor, { footnotes: items });
        }}
        onClose={() => setFootnotesOpen(false)}
      />
      <CommentsDialog
        editor={editor}
        open={commentsOpen}
        comments={docSettings.comments}
        onApply={(items) => {
          if (editor) updateDocSettings(editor, { comments: items });
        }}
        onClose={() => setCommentsOpen(false)}
      />
      <CharacterDialog
        editor={editor}
        open={characterOpen}
        onClose={() => setCharacterOpen(false)}
      />
      <CrossRefDialog editor={editor} open={crossRefOpen} onClose={() => setCrossRefOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
