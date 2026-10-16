import type { Editor } from '@tiptap/react';
import { ToolbarButton, ToolbarSeparator } from '@gratis/ui';
import { useRef } from 'react';
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

export interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const disabled = !editor;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cellColorInputRef = useRef<HTMLInputElement>(null);
  const selectClass =
    'rounded border border-gray-300 bg-white px-1 py-0.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900';

  const currentBlock = () => {
    if (!editor) return 'paragraph';
    for (const level of [1, 2, 3, 4, 5, 6]) {
      if (editor.isActive('heading', { level })) return String(level);
    }
    return 'paragraph';
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b border-gray-300 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-900"
    >
      <ToolbarButton
        aria-label="Undo"
        disabled={disabled || !editor?.can().undo()}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        aria-label="Redo"
        disabled={disabled || !editor?.can().redo()}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        ↷
      </ToolbarButton>
      <ToolbarSeparator />

      <select
        aria-label="Block style"
        className={selectClass}
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
        className="font-bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        aria-label="Italic"
        active={editor?.isActive('italic') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        aria-label="Underline"
        active={editor?.isActive('underline') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        className="underline"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        aria-label="Strikethrough"
        active={editor?.isActive('strike') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        className="line-through"
      >
        S
      </ToolbarButton>
      <ToolbarButton
        aria-label="Superscript"
        active={editor?.isActive('superscript') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleSuperscript().run()}
      >
        x²
      </ToolbarButton>
      <ToolbarButton
        aria-label="Subscript"
        active={editor?.isActive('subscript') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleSubscript().run()}
      >
        x₂
      </ToolbarButton>
      <ToolbarSeparator />

      <label className="flex items-center gap-1 text-sm">
        <span aria-hidden="true" className="border-b-2 border-red-600 px-0.5 font-bold">
          A
        </span>
        <input
          aria-label="Text color"
          type="color"
          className="h-6 w-6 cursor-pointer"
          disabled={disabled}
          onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <label className="flex items-center gap-1 text-sm">
        <span aria-hidden="true" className="bg-yellow-300 px-0.5 font-bold">
          A
        </span>
        <input
          aria-label="Highlight color"
          type="color"
          className="h-6 w-6 cursor-pointer"
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
        ↺
      </ToolbarButton>
      <ToolbarSeparator />

      <select
        aria-label="Font family"
        className={selectClass}
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
        className={selectClass}
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
        className={selectClass}
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
        ⇤
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align center"
        active={editor?.isActive({ textAlign: 'center' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      >
        ↔
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align right"
        active={editor?.isActive({ textAlign: 'right' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
      >
        ⇥
      </ToolbarButton>
      <ToolbarButton
        aria-label="Justify"
        active={editor?.isActive({ textAlign: 'justify' }) ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      >
        ☰
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Bullet list"
        active={editor?.isActive('bulletList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        aria-label="Numbered list"
        active={editor?.isActive('orderedList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        1≡
      </ToolbarButton>
      <ToolbarButton
        aria-label="Task list"
        active={editor?.isActive('taskList') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
      >
        ☑≡
      </ToolbarButton>
      <ToolbarButton
        aria-label="Indent"
        disabled={disabled}
        onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}
      >
        →|
      </ToolbarButton>
      <ToolbarButton
        aria-label="Outdent"
        disabled={disabled}
        onClick={() => editor?.chain().focus().liftListItem('listItem').run()}
      >
        |←
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Blockquote"
        active={editor?.isActive('blockquote') ?? false}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        ❝
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
        🔗
      </ToolbarButton>
      <ToolbarButton
        aria-label="Horizontal rule"
        disabled={disabled}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        ―
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton
        aria-label="Insert table"
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        ⊞
      </ToolbarButton>
      <ToolbarButton
        aria-label="Add row below"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().addRowAfter().run()}
      >
        +R
      </ToolbarButton>
      <ToolbarButton
        aria-label="Delete row"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().deleteRow().run()}
      >
        -R
      </ToolbarButton>
      <ToolbarButton
        aria-label="Add column right"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
      >
        +C
      </ToolbarButton>
      <ToolbarButton
        aria-label="Delete column"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().deleteColumn().run()}
      >
        -C
      </ToolbarButton>
      <ToolbarButton
        aria-label="Merge cells"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().mergeCells().run()}
      >
        ⧉
      </ToolbarButton>
      <ToolbarButton
        aria-label="Split cell"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().splitCell().run()}
      >
        ⧇
      </ToolbarButton>
      <ToolbarButton
        aria-label="Toggle header row"
        disabled={disabled || !editor?.isActive('table')}
        onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
      >
        ⇧R
      </ToolbarButton>
      <input
        ref={cellColorInputRef}
        aria-label="Cell shading color"
        type="color"
        className="h-6 w-6 cursor-pointer"
        disabled={disabled || !editor?.isActive('table')}
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
        🖼
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
        disabled={disabled || !editor?.isActive('image')}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'left' }).run()}
      >
        ⇤🖼
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align image center"
        disabled={disabled || !editor?.isActive('image')}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'center' }).run()}
      >
        ↔🖼
      </ToolbarButton>
      <ToolbarButton
        aria-label="Align image right"
        disabled={disabled || !editor?.isActive('image')}
        onClick={() => editor?.chain().focus().updateAttributes('image', { align: 'right' }).run()}
      >
        ⇥🖼
      </ToolbarButton>
    </div>
  );
}
