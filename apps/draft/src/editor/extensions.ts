import type { Extensions } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style/text-style-kit';
import StarterKit from '@tiptap/starter-kit';
import { GratisDoc } from './doc';
import { ImageWithAlign } from './images';
import { PageBreak } from './pageBreak';
import {
  TableCellWithShading,
  TableHeaderWithShading,
  TableRowExtension,
  TableWithShading,
} from './tables';

export function getEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      document: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      link: { openOnClick: false },
    }),
    GratisDoc,
    PageBreak,
    TextStyleKit,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableWithShading.configure({ resizable: true }),
    TableRowExtension,
    TableCellWithShading,
    TableHeaderWithShading,
    ImageWithAlign.configure({ allowBase64: true, resize: { enabled: true } }),
  ];
}
