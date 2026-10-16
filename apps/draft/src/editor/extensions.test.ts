import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { CellSelection } from '@tiptap/pm/tables';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_DOC_SETTINGS, readDocSettings, updateDocSettings } from './doc';
import { CommentMark, removeComment } from './comments';
import { removeFootnote } from './footnotes';
import { collectHeadings } from './toc';
import { findBookmarks } from './bookmarks';
import { findCaptions } from './captions';
import { STYLE_PRESETS } from './styles';
import { getEditorExtensions } from './extensions';

let editor: Editor | null = null;

function createEditor(content = '<p>Hello world</p>') {
  editor = new Editor({ extensions: getEditorExtensions(), content });
  return editor;
}

function findPreset(id: string) {
  const preset = STYLE_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`missing preset: ${id}`);
  return preset;
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

  it('inserts a manual page break node', () => {
    const ed = createEditor();
    ed.commands.setPageBreak();
    expect(ed.getJSON().content?.some((n) => n.type === 'pageBreak')).toBe(true);
    expect(ed.getHTML()).toContain('data-page-break');
  });

  it('adds footnotes with a reference node and a registered note', () => {
    const ed = createEditor();
    ed.commands.addFootnote();
    const json = ed.getJSON();
    const hasRef = json.content?.some((node) =>
      node.content?.some((child) => child.type === 'footnoteRef'),
    );
    expect(hasRef).toBe(true);
    expect(ed.getHTML()).toContain('data-footnote-id');
    const settings = readDocSettings(ed.state.doc);
    expect(settings.footnotes).toHaveLength(1);
    expect(settings.footnotes[0].text).toBe('');
  });

  it('removes a footnote with its references and note', () => {
    const ed = createEditor();
    ed.commands.addFootnote();
    updateDocSettings(ed, { footnotes: [{ id: 'fn-test', text: 'Hello note' }] });
    ed.commands.addFootnote();
    const notes = readDocSettings(ed.state.doc).footnotes;
    expect(notes).toHaveLength(2);
    const target = notes.find((note) => note.id === 'fn-test');
    expect(target).toBeTruthy();
    removeFootnote(ed, 'fn-test');
    const after = readDocSettings(ed.state.doc);
    expect(after.footnotes.some((note) => note.id === 'fn-test')).toBe(false);
    let remainingRefs = 0;
    ed.state.doc.descendants((node) => {
      if (
        node.type.name === 'footnoteRef' &&
        (node.attrs as Record<string, unknown>).noteId === 'fn-test'
      ) {
        remainingRefs += 1;
      }
    });
    expect(remainingRefs).toBe(0);
  });

  it('adds a comment mark on a selection and registers the comment', () => {
    const ed = createEditor('<p>Hello world</p>');
    ed.commands.setTextSelection({ from: 7, to: 12 });
    expect(ed.commands.addComment()).toBe(true);
    const settings = readDocSettings(ed.state.doc);
    expect(settings.comments).toHaveLength(1);
    expect(settings.comments[0].author).toBe('Me');
    expect(ed.getHTML()).toContain('data-comment-id');
    expect(ed.getHTML()).toContain('gd-comment');
    expect(CommentMark).toBeTruthy();
  });

  it('removes a comment mark and its entry', () => {
    const ed = createEditor('<p>Hello world</p>');
    ed.commands.setTextSelection({ from: 7, to: 12 });
    ed.commands.addComment();
    const [comment] = readDocSettings(ed.state.doc).comments;
    removeComment(ed, comment.id);
    const after = readDocSettings(ed.state.doc);
    expect(after.comments).toHaveLength(0);
    expect(ed.getHTML()).not.toContain('data-comment-id');
  });

  it('inserts a table of contents with collected headings', () => {
    const ed = createEditor('<h1>Alpha</h1><p>mid</p><h2>Beta</h2>');
    expect(ed.commands.insertTableOfContents()).toBe(true);
    expect(collectHeadings(ed.state.doc)).toEqual([
      { text: 'Alpha', level: 1 },
      { text: 'Beta', level: 2 },
    ]);
    const tocNodes: ProsemirrorNode[] = [];
    ed.state.doc.descendants((node) => {
      if (node.type.name === 'toc') tocNodes.push(node);
    });
    expect(tocNodes).toHaveLength(1);
    expect(tocNodes[0].attrs.entries).toEqual([
      { text: 'Alpha', level: 1 },
      { text: 'Beta', level: 2 },
    ]);
    expect(ed.getHTML()).toContain('data-toc');
  });

  it('refreshes stale table of contents entries', () => {
    const ed = createEditor('<h1>Alpha</h1>');
    expect(ed.commands.insertTableOfContents()).toBe(true);
    ed.chain()
      .insertContentAt(ed.state.doc.content.size - 1, {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Added later' }],
      })
      .run();
    expect(ed.commands.updateTableOfContents()).toBe(true);
    const tocNodes: ProsemirrorNode[] = [];
    ed.state.doc.descendants((node) => {
      if (node.type.name === 'toc') tocNodes.push(node);
    });
    expect(tocNodes[0].attrs.entries).toEqual([
      { text: 'Alpha', level: 1 },
      { text: 'Added later', level: 2 },
    ]);
  });

  it('updateTableOfContents is a no-op when entries match', () => {
    const ed = createEditor('<h1>Alpha</h1>');
    expect(ed.commands.insertTableOfContents()).toBe(true);
    const before = ed.state.doc;
    expect(ed.commands.updateTableOfContents()).toBe(true);
    expect(before.eq(ed.state.doc)).toBe(true);
  });

  it('applies style presets to the selection', () => {
    const title = findPreset('title');
    const edTitle = createEditor('<p>Hello world</p>');
    edTitle.commands.setTextSelection({ from: 1, to: 12 });
    title.apply(edTitle);
    expect(edTitle.isActive('heading', { level: 1 })).toBe(true);

    const quote = findPreset('quote');
    const edQuote = createEditor('<p>Hello world</p>');
    edQuote.commands.setTextSelection({ from: 1, to: 12 });
    quote.apply(edQuote);
    expect(edQuote.isActive('blockquote')).toBe(true);
    quote.apply(edQuote);
    expect(edQuote.isActive('blockquote')).toBe(false);

    const normal = findPreset('normal');
    normal.apply(edTitle);
    expect(edTitle.isActive('heading')).toBe(false);
    expect(edTitle.isActive('bold')).toBe(false);
  });

  it('offers list and checklist presets', () => {
    const bullet = findPreset('bullet-list');
    const ed = createEditor('<p>Hello world</p>');
    ed.commands.setTextSelection({ from: 1, to: 12 });
    bullet.apply(ed);
    expect(ed.isActive('bulletList')).toBe(true);
    const task = findPreset('task-list');
    task.apply(ed);
    expect(ed.isActive('taskList')).toBe(true);
  });

  it('inserts figure and table captions with unique ids', () => {
    const ed = createEditor('<p>Hello world</p>');
    expect(ed.chain().insertCaption('Figure').run()).toBe(true);
    expect(ed.chain().insertCaption('Table').run()).toBe(true);
    const captions = findCaptions(ed.state.doc);
    expect(captions).toHaveLength(2);
    expect(captions.map((c) => c.label)).toEqual(['Figure', 'Table']);
    expect(captions[0].cid).toMatch(/^cap-/);
    expect(captions[1].cid).toMatch(/^cap-/);
    expect(ed.getHTML()).toContain('data-caption');
  });

  it('inserts bookmarks and cross-references that update labels', () => {
    const ed = createEditor('<p>Hello world</p>');
    expect(ed.chain().insertBookmark().run()).toBe(true);
    const bookmarks = findBookmarks(ed.state.doc);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].refLabel).toBe('bm1');
    expect(ed.chain().insertCrossRef('bookmark', bookmarks[0].bookmarkId).run()).toBe(true);
    const xrefs: ProsemirrorNode[] = [];
    ed.state.doc.descendants((node) => {
      if (node.type.name === 'crossRef') xrefs.push(node);
    });
    expect(xrefs).toHaveLength(1);
    expect(xrefs[0].attrs.refLabel).toBe('bm1');
    expect(ed.getHTML()).toContain('data-xref');
  });
});
