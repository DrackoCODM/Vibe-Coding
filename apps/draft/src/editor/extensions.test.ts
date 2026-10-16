import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { getEditorExtensions } from './extensions';

let editor: Editor | null = null;

function createEditor(content = '<p>Hello world</p>') {
  editor = new Editor({ extensions: getEditorExtensions(), content });
  return editor;
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
});
