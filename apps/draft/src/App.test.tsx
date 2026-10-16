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

  it('applies orientation, columns and watermark to the canvas', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Orientation'), { target: { value: 'landscape' } });
    expect(screen.getByLabelText('Page canvas').getAttribute('data-orientation')).toBe('landscape');
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '2' } });
    expect(screen.getByLabelText('Page canvas').getAttribute('data-columns')).toBe('2');
    fireEvent.change(screen.getByLabelText('Watermark text'), { target: { value: 'DRAFT' } });
    expect(screen.getAllByTestId('watermark')[0].textContent).toBe('DRAFT');
  });

  it('defaults to dark theme and toggles the dark class on the html element', () => {
    localStorage.removeItem('gratisdraft.theme');
    render(<App />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('provides a rich text editing surface', async () => {
    const { container } = render(<App />);
    const editable = await screen.findByRole('textbox', { name: 'Document content' });
    expect(editable).toBeTruthy();
    expect(editable.getAttribute('contenteditable')).toBe('true');
    expect(editable.getAttribute('aria-multiline')).toBe('true');
    expect(container.querySelector('.ProseMirror')).toBeTruthy();
  });

  it('shows the horizontal ruler reflecting page setup', () => {
    render(<App />);
    const ruler = screen.getByTestId('ruler');
    expect(ruler.getAttribute('aria-label')).toBe('Horizontal ruler, A4, 100 percent zoom');
    fireEvent.change(screen.getByLabelText('Page size'), { target: { value: 'letter' } });
    expect(screen.getByTestId('ruler').getAttribute('aria-label')).toContain('LETTER');
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
