import { mmToPx } from '@gratis/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MARGIN_PRESETS } from '../page/margins';
import { Ruler, rulerTicks } from './Ruler';

describe('rulerTicks', () => {
  it('generates minor ticks every 5 mm across the page width', () => {
    const ticks = rulerTicks(210);
    expect(ticks).toHaveLength(43);
    expect(ticks[0]).toEqual({ mm: 0, major: true });
    expect(ticks[ticks.length - 1]).toEqual({ mm: 210, major: true });
  });

  it('marks every centimetre as major', () => {
    const majors = rulerTicks(210).filter((t) => t.major);
    expect(majors).toHaveLength(22);
    expect(majors.map((t) => t.mm)).toContain(100);
  });
});

describe('Ruler', () => {
  it('renders with an accessible label and one tick per 5 mm', () => {
    render(<Ruler pageSize="a4" margins={MARGIN_PRESETS.normal} zoomPercent={100} />);
    const ruler = screen.getByTestId('ruler');
    expect(ruler.getAttribute('aria-label')).toBe('Horizontal ruler, A4, 100 percent zoom');
    expect(ruler.querySelectorAll('[data-mm]')).toHaveLength(43);
  });

  it('scales with zoom', () => {
    render(<Ruler pageSize="a4" margins={MARGIN_PRESETS.normal} zoomPercent={50} />);
    const ruler = screen.getByTestId('ruler');
    const width = parseFloat(ruler.style.width);
    expect(width).toBeCloseTo(mmToPx(210) * 0.5, 1);
  });

  it('renders cm labels above major ticks', () => {
    render(<Ruler pageSize="letter" margins={MARGIN_PRESETS.wide} zoomPercent={100} />);
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
  });
});
