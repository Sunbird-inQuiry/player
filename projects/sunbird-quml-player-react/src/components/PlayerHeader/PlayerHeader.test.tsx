import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerHeader } from './PlayerHeader';
import type { Section } from '../../types';

const mkSection = (id: string): Section => ({
  identifier: id,
  name: id,
  children: [],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
});

const baseProps = {
  brand: 'Sunbird',
  sections: [mkSection('a'), mkSection('b'), mkSection('c')],
  currentSectionIndex: 0,
  completed: [false, false, false],
  questionNumber: 1,
  totalQuestions: 9,
  onSubmit: vi.fn(),
};

describe('PlayerHeader', () => {
  it('renders brand, step indicators, counter and timer', () => {
    render(<PlayerHeader {...baseProps} timeRemaining={889} />);
    expect(screen.getByText('Sunbird')).toBeInTheDocument();
    expect(screen.getByText('1/9')).toBeInTheDocument();
    expect(screen.getByText('14:49')).toBeInTheDocument(); // mm:ss of 889
    const steps = screen.getAllByRole('listitem');
    expect(steps[0]).toHaveAttribute('aria-current', 'step');
  });

  it('hides the timer when no time remaining is given', () => {
    render(<PlayerHeader {...baseProps} timeRemaining={null} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('emits onSubmit', () => {
    const onSubmit = vi.fn();
    render(<PlayerHeader {...baseProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('emits onBrandClick when the brand is clicked', () => {
    const onBrandClick = vi.fn();
    render(<PlayerHeader {...baseProps} onBrandClick={onBrandClick} />);
    fireEvent.click(screen.getByRole('button', { name: /sunbird/i }));
    expect(onBrandClick).toHaveBeenCalledTimes(1);
  });
});
