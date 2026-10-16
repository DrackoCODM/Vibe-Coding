import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuBar, type MenuDefinition } from './MenuBar';

const menus: MenuDefinition[] = [
  {
    label: 'File',
    items: [
      { label: 'New', shortcut: 'Ctrl+N', onSelect: vi.fn() },
      { label: 'Save', shortcut: 'Ctrl+S', onSelect: vi.fn() },
      { label: 'Disabled item', disabled: true, onSelect: vi.fn() },
    ],
  },
  { label: 'Edit', items: [{ label: 'Undo', onSelect: vi.fn() }] },
];

describe('MenuBar', () => {
  it('shows menu labels without opening dropdowns', () => {
    render(<MenuBar menus={menus} />);
    expect(screen.getByText('File')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('opens a dropdown on click, shows shortcuts, and selects an item', async () => {
    const user = userEvent.setup();
    render(<MenuBar menus={menus} />);
    await user.click(screen.getByText('File'));
    expect(screen.getByRole('menu', { name: 'File' })).toBeTruthy();
    expect(screen.getByText('Ctrl+S')).toBeTruthy();
    await user.click(screen.getByText('Save'));
    expect(menus[0].items[1].onSelect).toHaveBeenCalled();
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
  });

  it('disables items marked disabled', async () => {
    const user = userEvent.setup();
    render(<MenuBar menus={menus} />);
    await user.click(screen.getByText('File'));
    const disabled = screen.getByRole('menuitem', { name: 'Disabled item' }) as HTMLButtonElement;
    expect(disabled.disabled).toBe(true);
  });

  it('switches between open menus', async () => {
    const user = userEvent.setup();
    render(<MenuBar menus={menus} />);
    await user.click(screen.getByText('File'));
    await user.click(screen.getByText('Edit'));
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Edit' })).toBeTruthy();
  });
});
