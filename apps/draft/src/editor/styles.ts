import type { Editor } from '@tiptap/react';

export interface StylePreset {
  id: string;
  label: string;
  apply: (editor: Editor) => void;
}

/** Paragraph style presets, one chain call each, applied to the selection. */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'title',
    label: 'Title',
    apply: (editor) => {
      editor.chain().focus().setHeading({ level: 1 }).setFontSize('26px').setBold().run();
    },
  },
  {
    id: 'subtitle',
    label: 'Subtitle',
    apply: (editor) => {
      editor.chain().focus().setParagraph().setFontSize('16px').setItalic().run();
    },
  },
  {
    id: 'normal',
    label: 'Normal',
    apply: (editor) => {
      editor.chain().focus().setParagraph().setFontSize('11px').unsetBold().unsetItalic().run();
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    apply: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: 'code',
    label: 'Code block',
    apply: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    id: 'bullet-list',
    label: 'Bullet list',
    apply: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: 'ordered-list',
    label: 'Numbered list',
    apply: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: 'task-list',
    label: 'Checklist',
    apply: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
];
