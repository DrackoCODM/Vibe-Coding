import type { Editor } from '@tiptap/react';
import { ToolbarButton, ToolbarSeparator } from '@gratis/ui';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Columns3,
  Eraser,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Merge,
  Minus,
  Quote,
  Redo2,
  Rows3,
  Split,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { readFileAsDataUrl } from '../editor/images';

const FONT_FAMILIES = [
  'Arial',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Times New Roman',
  'Verdana',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const LINE_SPACINGS = ['1', '1.15', '1.5', '2', '2.5', '3'];

const HEADING_OPTIONS = [
  { value: 'paragraph', label: 'Normal text' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
  { value: '4', label: 'Heading 4' },
  { value: '5', label: 'Heading 5' },
  { value: '6', label: 'Heading 6' },
];

const iconProps = { size: 15, strokeWidth: 2 } as const;

export interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const disabled = !editor;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((t) => t + 1);
    editor.on('update', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('update', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  const currentBlock = () => {
    if (!editor) return 'paragraph';
    for (const level of [1, 2, 3, 4, 5, 6]) {
      if (editor.isActive('heading', { level })) return String(level);
    }
    return 'paragraph';
  };

  const inTable = () => disabled || !editor?.isActive('table');
  const noImage = () => disabled || !editor?.isActive('image');

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-line bg-raised px-2 py-1.5"
    >
      <ToolbarButton
        aria-label="Undo"
        disabled={disabled || !editor?.can().undo()}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo2 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Redo"
        disabled={disabled || !editor?.can().redo()}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo2 {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <select
        aria-label="Block style"
        className="gratis-select mr-1 w-32"
        disabled={disabled}
        value={currentBlock()}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            editor?.chain().focus().setParagraph().run();
          } else {
            editor
              ?.chain()
              .focus()
              .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })
              .run();
          }
        }}
      >
        {HEADING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Bold"
        active={editor?.isActive('bold') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Italic"
        active={editor?.isActive('italic') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Underline"
        active={editor?.isActive('underline') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Underline {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Strikethrough"
        active={editor?.isActive('strike') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Superscript"
        active={editor?.isActive('superscript') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleSuperscript().run()}
      >
        <Superscript {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Subscript"
        active={editor?.isActive('subscript') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleSubscript().run()}
      >
        <Subscript {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <label className="gratis-toolbar-button" title="Text color">
        <Baseline {...iconProps} />
        <input
          aria-label="Text color"
          type="color"
          className="gratis-color-input -ml-0.5"
          disabled={disabled}
          onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <label className="gratis-toolbar-button" title="Highlight color">
        <Highlighter {...iconProps} />
        <input
          aria-label="Highlight color"
          type="color"
          className="gratis-color-input -ml-0.5"
          disabled={disabled}
          defaultValue="#ffff00"
          onChange={(e) => editor?.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
      </label>
      <ToolbarButton
        aria-label="Clear highlight"
        disabled={disabled}
        onClick={() => editor?.chain().focus().unsetHighlight().run()}
      >
        <Eraser {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <select
        aria-label="Font family"
        className="gratis-select mr-1 w-28"
        disabled={disabled}
        value=""
        onChange={(e) => {
          if (e.target.value) editor?.chain().focus().setFontFamily(e.target.value).run();
        }}
      >
        <option value="" disabled>
          Font
        </option>
        {FONT_FAMILIES.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        className="gratis-select mr-1 w-20"
        disabled={disabled}
        value=""
        onChange={(e) => {
          if (e.target.value) editor?.chain().focus().setFontSize(`${e.target.value}px`).run();
        }}
      >
        <option value="" disabled>
          Size
        </option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <select
        aria-label="Line spacing"
        className="gratis-select mr-1 w-24"
        disabled={disabled}
        value=""
        onChange={(e) => {
          if (e.target.value) editor?.chain().focus().setLineHeight(e.target.value).run();
        }}
      >
        <option value="" disabled>
          Spacing
        </option>
        {LINE_SPACINGS.map((spacing) => (
          <option key={spacing} value={spacing}>
            {spacing}
          </option>
        ))}
      </select>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Align left"
        active={editor?.isActive({ textAlign: 'left' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align center"
        active={editor?.isActive({ textAlign: 'center' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align right"
        active={editor?.isActive({ textAlign: 'right' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Justify"
        active={editor?.isActive({ textAlign: 'justify' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Bullet list"
        active={editor?.isActive('bulletList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Numbered list"
        active={editor?.isActive('orderedList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Task list"
        active={editor?.isActive('taskList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
      >
        <ListChecks {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Indent"
        disabled={disabled}
        onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}
      >
        <IndentIncrease {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Outdent"
        disabled={disabled}
        onClick={() => editor?.chain().focus().liftListItem('listItem').run()}
      >
        <IndentDecrease {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Blockquote"
        active={editor?.isActive('blockquote') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Link"
        active={editor?.isActive('link') ?? false}
        disabled={disabled}
        onClick={() => {
          if (!editor) return;
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt('Link URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        <Link2 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Horizontal rule"
        disabled={disabled}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <Minus {...iconProps} />
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Insert table"
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Table {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Add row below"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().addRowAfter().run()}
      >
        <Rows3 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Delete row"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().deleteRow().run()}
      >
        <Trash2 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Add column right"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
      >
        <Columns3 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Delete column"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().deleteColumn().run()}
      >
        <Trash2 {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Merge cells"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().mergeCells().run()}
      >
        <Merge {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Split cell"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().splitCell().run()}
      >
        <Split {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Toggle header row"
        disabled={inTable()}
        onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
      >
        <Baseline {...iconProps} />
      </ToolbarButton>
      <input
        aria-label="Cell shading color"
        type="color"
        className="gratis-color-input"
        disabled={inTable()}
        defaultValue="#ffff88"
        onChange={(e) =>
          editor?.chain().focus().setCellAttribute('backgroundColor', e.target.value).run()
        }
      />
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Insert image"
        disabled={disabled}
        onClick={() => imageInputRef.current?.click()}
      >
        <ImageIcon {...iconProps} />
      </ToolbarButton>
      <input
        ref={imageInputRef}
        data-testid="image-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file || !editor) return;
          const src = await readFileAsDataUrl(file);
          editor.chain().focus().setImage({ src, alt: file.name }).run();
        }}
      />
      <ToolbarButton
        aria-label="Align image left"
        disabled={noImage()}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'left' }).run()}
      >
        <AlignLeft {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align image center"
        disabled={noImage()}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'center' }).run()}
      >
        <AlignCenter {...iconProps} />
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align image right"
        disabled={noImage()}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'right' }).run()}
      >
        <AlignRight {...iconProps} />
      </ToolbarButton>
    </div>
  );
}
