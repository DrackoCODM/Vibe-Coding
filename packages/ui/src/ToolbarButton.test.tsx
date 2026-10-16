import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToolbarButton } from './ToolbarButton';

describe('ToolbarButton', () => {
  it('renders its label', () => {
    render(<ToolbarButton>B</ToolbarButton>);
    expect(screen.getByRole('button', { name: 'B' })).toBeTruthy();
  });

  it('exposes active state via aria-pressed', () => {
    render(<ToolbarButton active>B</ToolbarButton>);
    expect(screen.getByRole('button', { name: 'B' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<ToolbarButton onClick={onClick}>I</ToolbarButton>);
    screen.getByRole('button', { name: 'I' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
