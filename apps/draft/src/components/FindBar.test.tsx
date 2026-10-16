import { Editor } from '@tiptap/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEditorExtensions } from '../editor/extensions';
import { getDocText } from '../editor/stats';
import { FindBar } from './FindBar';

let editor: Editor;

afterEach(() => {
  cleanup();
  editor?.destroy();
});

describe('FindBar', () => {
  it('renders nothing when closed', () => {
    render(<FindBar editor={null} open={false} showReplace={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('search')).toBeNull();
  });

  it('counts matches while typing and navigates between them', () => {
    editor = new Editor({
      extensions: getEditorExtensions(),
      content: '<p>cat dog cat</p>',
    });
    render(<FindBar editor={editor} open showReplace={false} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Find'), { target: { value: 'cat' } });
    expect(screen.getByTestId('find-count').textContent).toBe('1 of 2');
    fireEvent.click(screen.getByLabelText('Next match'));
    expect(screen.getByTestId('find-count').textContent).toBe('2 of 2');
    fireEvent.click(screen.getByLabelText('Next match'));
    expect(screen.getByTestId('find-count').textContent).toBe('1 of 2');
    fireEvent.click(screen.getByLabelText('Previous match'));
    expect(screen.getByTestId('find-count').textContent).toBe('2 of 2');
  });

  it('shows no results for a missing query', () => {
    editor = new Editor({
      extensions: getEditorExtensions(),
      content: '<p>cat</p>',
    });
    render(<FindBar editor={editor} open showReplace={false} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Find'), { target: { value: 'bird' } });
    expect(screen.getByTestId('find-count').textContent).toBe('No results');
    expect((screen.getByLabelText('Next match') as HTMLButtonElement).disabled).toBe(true);
  });

  it('replaces all matches when replace row is shown', () => {
    editor = new Editor({
      extensions: getEditorExtensions(),
      content: '<p>cat cat</p>',
    });
    render(<FindBar editor={editor} open showReplace onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Find'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'dog' } });
    fireEvent.click(screen.getByText('Replace all'));
    expect(getDocText(editor.state.doc)).toBe('dog dog');
    expect(screen.getByTestId('find-count').textContent).toBe('No results');
  });

  it('hides the replace row when only find is open', () => {
    editor = new Editor({ extensions: getEditorExtensions(), content: '<p>cat</p>' });
    render(<FindBar editor={editor} open showReplace={false} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Replace with')).toBeNull();
    expect(screen.queryByText('Replace all')).toBeNull();
  });

  it('calls onClose from the close button', () => {
    const onClose = vi.fn();
    editor = new Editor({ extensions: getEditorExtensions(), content: '<p>cat</p>' });
    render(<FindBar editor={editor} open showReplace={false} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close find bar'));
    expect(onClose).toHaveBeenCalled();
  });
});
