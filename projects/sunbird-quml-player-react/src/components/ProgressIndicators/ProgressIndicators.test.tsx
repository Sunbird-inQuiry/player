import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar, SectionSteps } from './ProgressIndicators';
import type { Section } from '../../types';

const mkSection = (id: string): Section => ({
  identifier: id,
  name: id,
  children: [],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
});

describe('ProgressBar', () => {
  it('exposes progressbar ARIA values', () => {
    render(<ProgressBar answered={3} total={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });
});

describe('SectionSteps', () => {
  it('marks the active section with aria-current', () => {
    const sections = [mkSection('a'), mkSection('b'), mkSection('c')];
    render(
      <SectionSteps
        sections={sections}
        currentSectionIndex={1}
        completed={[true, false, false]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});
