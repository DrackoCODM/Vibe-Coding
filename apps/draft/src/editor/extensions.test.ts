import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { CellSelection } from '@tiptap/pm/tables';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_DOC_SETTINGS, readDocSettings, updateDocSettings } from './doc';
import { getEditorExtensions } from './extensions';

let editor: Editor | null = null;

function createEditor(content = '<p>Hello world</p>') {
  editor = new Editor({ extensions: getEditorExtensions(), content });
  return editor;
}

function selectImage(ed: Editor) {
  let imagePos = -1;
  ed.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && imagePos === -1) imagePos = pos;
  });
  expect(imagePos).toBeGreaterThanOrEqual(0);
  ed.view.dispatch(ed.state.tr.setSelection(NodeSelection.create(ed.state.doc, imagePos)));
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('editor extensions', () => {
  it('applies bold to the selection', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setBold();
    expect(ed.getHTML()).toContain('<strong>Hello</strong>');
  });

  it('applies italic, underline and strike', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setItalic();
    ed.commands.setUnderline();
    ed.commands.setStrike();
    const html = ed.getHTML();
    expect(html).toContain('<em');
    expect(html).toContain('<u');
    expect(html).toContain('<s');
  });

  it('applies heading levels 1-6', () => {
    const ed = createEditor();
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      ed.commands.setTextSelection({ from: 1, to: 6 });
      ed.commands.toggleHeading({ level });
      expect(ed.getHTML()).toContain(`<h${level}>`);
      ed.commands.toggleHeading({ level });
    }
  });

  it('applies font size, font family, line height and color via textStyle', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setFontSize('18px');
    ed.commands.setFontFamily('Georgia');
    ed.commands.setLineHeight('1.5');
    ed.commands.setColor('#ff0000');
    const html = ed.getHTML();
    expect(html).toContain('font-size: 18px');
    expect(html).toContain('font-family: Georgia');
    expect(html).toContain('line-height: 1.5');
    expect(html).toContain('color: rgb(255, 0, 0)');
  });

  it('toggles bullet, ordered and task lists', () => {
    const ed = createEditor('<p>item</p>');
    ed.commands.setTextSelection({ from: 1, to: 5 });
    ed.commands.toggleBulletList();
    expect(ed.getHTML()).toContain('<ul');
    ed.commands.toggleBulletList();
    ed.commands.toggleOrderedList();
    expect(ed.getHTML()).toContain('<ol');
    ed.commands.toggleOrderedList();
    ed.commands.toggleTaskList();
    expect(ed.getHTML()).toContain('data-type="taskList"');
  });

  it('toggles blockquote, horizontal rule and superscript/subscript', () => {
    const ed = createEditor();
    ed.commands.toggleBlockquote();
    expect(ed.getHTML()).toContain('<blockquote');
    ed.commands.setHorizontalRule();
    expect(ed.getHTML()).toContain('<hr');
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setSuperscript();
    expect(ed.getHTML()).toContain('<sup');
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.unsetSuperscript();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setSubscript();
    expect(ed.getHTML()).toContain('<sub');
  });

  it('sets and unsets links', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setLink({ href: 'https://example.com' });
    expect(ed.getHTML()).toContain('href="https://example.com"');
    ed.commands.unsetLink();
    expect(ed.getHTML()).not.toContain('href=');
  });

  it('supports undo and redo', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setBold();
    const withBold = ed.getHTML();
    ed.commands.undo();
    expect(ed.getHTML()).not.toBe(withBold);
    ed.commands.redo();
    expect(ed.getHTML()).toBe(withBold);
  });

  it('applies text alignment', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setTextAlign('center');
    expect(ed.getHTML()).toContain('text-align: center');
  });

  it('applies highlight', () => {
    const ed = createEditor();
    ed.commands.setTextSelection({ from: 1, to: 6 });
    ed.commands.setHighlight({ color: '#ffff00' });
    expect(ed.getHTML()).toContain('background-color: rgb(255, 255, 0)');
  });

  it('inserts a table with rows and columns', () => {
    const ed = createEditor();
    ed.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    const html = ed.getHTML();
    expect(html).toContain('<table');
    expect(ed.getJSON().content?.some((n) => n.type === 'table')).toBe(true);
  });

  it('adds and deletes table rows and columns', () => {
    const ed = createEditor();
    ed.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
    ed.commands.addRowAfter();
    ed.commands.addColumnAfter();
    let table = ed.getJSON().content?.find((n) => n.type === 'table');
    expect(table?.content?.length).toBe(3);
    ed.commands.deleteRow();
    ed.commands.deleteColumn();
    table = ed.getJSON().content?.find((n) => n.type === 'table');
    expect(table?.content?.length).toBe(2);
  });

  it('applies cell shading via backgroundColor attribute', () => {
    const ed = createEditor();
    ed.commands.insertTable({ rows: 1, cols: 1, withHeaderRow: false });
    ed.commands.setCellAttribute('backgroundColor', '#ff0000');
    expect(ed.getHTML()).toContain('background-color: rgb(255, 0, 0)');
  });

  it('merges selected table cells', () => {
    const ed = createEditor();
    ed.commands.insertTable({ rows: 1, cols: 2, withHeaderRow: false });
    let firstCellPos = -1;
    let secondCellPos = -1;
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === 'tableCell') {
        if (firstCellPos === -1) firstCellPos = pos;
        else if (secondCellPos === -1) secondCellPos = pos;
      }
    });
    expect(firstCellPos).toBeGreaterThanOrEqual(0);
    expect(secondCellPos).toBeGreaterThan(firstCellPos);
    const firstResolved = ed.state.doc.resolve(firstCellPos);
    const secondResolved = ed.state.doc.resolve(secondCellPos);
    ed.view.dispatch(ed.state.tr.setSelection(new CellSelection(firstResolved, secondResolved)));
    expect(ed.commands.mergeCells()).toBe(true);
    expect(ed.getHTML()).toContain('colspan="2"');
  });

  it('inserts an image with alignment', () => {
    const ed = createEditor();
    ed.commands.setImage({ src: 'data:image/png;base64,AAAA', alt: 'test' });
    selectImage(ed);
    ed.commands.updateAttributes('image', { align: 'center' });
    const html = ed.getHTML();
    expect(html).toContain('<img');
    expect(html).toContain('data-align="center"');
  });

  it('resizes an image via width attribute', () => {
    const ed = createEditor();
    ed.commands.setImage({ src: 'data:image/png;base64,AAAA', alt: 'test' });
    selectImage(ed);
    ed.commands.updateAttributes('image', { width: '320' });
    const html = ed.getHTML();
    expect(html).toMatch(/width="320"|width: 320px/);
  });
});

describe('document settings', () => {
  it('exposes default settings on the document node', () => {
    const ed = createEditor();
    expect(readDocSettings(ed.state.doc)).toEqual(DEFAULT_DOC_SETTINGS);
  });

  it('updates orientation, columns and watermark via attributes', () => {
    const ed = createEditor();
    updateDocSettings(ed, { orientation: 'landscape', columns: 2 });
    const settings = readDocSettings(ed.state.doc);
    expect(settings.orientation).toBe('landscape');
    expect(settings.columns).toBe(2);
    const json = ed.getJSON();
    expect(json.attrs?.orientation).toBe('landscape');
    expect(json.attrs?.columns).toBe(2);
  });

  it('round-trips settings through JSON content', () => {
    const ed = createEditor();
    updateDocSettings(ed, { watermarkText: 'CONFIDENTIAL' });
    const json = ed.getJSON();
    const restored = new Editor({ extensions: getEditorExtensions(), content: json });
    try {
      expect(readDocSettings(restored.state.doc).watermarkText).toBe('CONFIDENTIAL');
    } finally {
      restored.destroy();
    }
  });
});
