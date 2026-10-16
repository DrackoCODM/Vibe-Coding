import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the app name, toolbar, page canvas and status bar', () => {
    render(<App />);
    expect(screen.getByText('GratisDraft')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeTruthy();
    expect(screen.getByLabelText('Page canvas')).toBeTruthy();
    expect(screen.getByLabelText('Status bar')).toBeTruthy();
    expect(screen.getByTestId('word-count').textContent).toBe('0 words');
    expect(screen.getByTestId('page-indicator').textContent).toBe('Page 1 of 1');
  });

  it('exposes page size, margin and zoom controls', () => {
    render(<App />);
    expect((screen.getByLabelText('Page size') as HTMLSelectElement).value).toBe('a4');
    expect(screen.getByLabelText('Margin preset')).toBeTruthy();
    expect(screen.getByLabelText('Zoom')).toBeTruthy();
  });

  it('changes the page size of the canvas', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Page size'), { target: { value: 'letter' } });
    expect(screen.getByLabelText('Page canvas').getAttribute('data-page-size')).toBe('letter');
  });

  it('toggles the dark theme class on the html element', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('provides a rich text editing surface', async () => {
    const { container } = render(<App />);
    const editable = await screen.findByRole('textbox', { name: '' });
    expect(editable).toBeTruthy();
    expect(editable.getAttribute('contenteditable')).toBe('true');
    expect(container.querySelector('.ProseMirror')).toBeTruthy();
  });

  it('exposes formatting toolbar controls', () => {
    render(<App />);
    for (const label of [
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Text color',
      'Highlight color',
      'Font family',
      'Font size',
      'Line spacing',
      'Align center',
      'Bullet list',
      'Numbered list',
      'Task list',
      'Blockquote',
      'Link',
      'Horizontal rule',
      'Insert table',
      'Add row below',
      'Delete row',
      'Add column right',
      'Delete column',
      'Merge cells',
      'Split cell',
      'Cell shading color',
      'Insert image',
      'Align image left',
      'Align image center',
      'Align image right',
      'Undo',
      'Redo',
    ]) {
      expect(screen.getByLabelText(label), label).toBeTruthy();
    }
  });
});
