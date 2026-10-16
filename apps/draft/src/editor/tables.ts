import { TableCell } from '@tiptap/extension-table/cell';
import { TableHeader } from '@tiptap/extension-table/header';
import { Table } from '@tiptap/extension-table/table';
import { TableRow } from '@tiptap/extension-table/row';

const backgroundColorAttribute = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
    renderHTML: (attributes: Record<string, unknown>) =>
      attributes.backgroundColor
        ? { style: `background-color: ${String(attributes.backgroundColor)}` }
        : {},
  },
};

export const TableWithShading = Table;
export const TableRowExtension = TableRow;
export const TableCellWithShading = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttribute,
    };
  },
});
export const TableHeaderWithShading = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttribute,
    };
  },
});
