import { Editor } from '@tiptap/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getEditorExtensions } from '../editor/extensions';
import { Toolbar } from './Toolbar';

let editor: Editor;

afterEach(() => {
  cleanup();
  editor?.destroy();
});

describe('Toolbar block style', () => {
  it('reflects the current block and applies heading levels', () => {
    editor = new Editor({ extensions: getEditorExtensions(), content: '<p>text</p>' });
    render(<Toolbar editor={editor} />);
    const select = screen.getByLabelText('Block style') as HTMLSelectElement;
    expect(select.value).toBe('paragraph');
    fireEvent.change(select, { target: { value: '2' } });
    expect(editor.isActive('heading', { level: 2 })).toBe(true);
    expect(select.value).toBe('2');
  });

  it('converts a heading back to normal text', () => {
    editor = new Editor({
      extensions: getEditorExtensions(),
      content: '<h1>Title</h1>',
    });
    render(<Toolbar editor={editor} />);
    const select = screen.getByLabelText('Block style') as HTMLSelectElement;
    expect(select.value).toBe('1');
    fireEvent.change(select, { target: { value: 'paragraph' } });
    expect(editor.isActive('heading')).toBe(false);
    expect(select.value).toBe('paragraph');
  });
});
