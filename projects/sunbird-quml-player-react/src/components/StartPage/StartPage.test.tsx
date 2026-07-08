import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartPage } from './StartPage';
import type { Section } from '../../types';

const mkSection = (id: string, name: string, count: number, description: string): Section => ({
  identifier: id,
  name,
  description,
  children: Array.from({ length: count }, (_, i) => ({
    identifier: `${id}_q${i}`,
    body: '',
    primaryCategory: 'multiple choice question',
    maxScore: 1,
  })),
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
});

const sections = [
  mkSection('a', 'Knowledge Check', 2, 'Recognise the right answer'),
  mkSection('b', 'Concepts & Recall', 1, 'Show what you remember'),
];

const baseProps = {
  title: 'Sunbird Assessment',
  sections,
  totalQuestions: 3,
  totalSections: 2,
  onStart: vi.fn(),
};

describe('StartPage', () => {
  it('renders title, the section list and the stats card', () => {
    render(<StartPage {...baseProps} timeLimit={900} attemptsLeft={3} />);
    expect(screen.getByRole('heading', { name: 'Sunbird Assessment' })).toBeInTheDocument();
    // The "assessment sections" grid lists the section names.
    expect(screen.getAllByText('Knowledge Check').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('15:00')).toBeInTheDocument(); // minutes stat
  });

  it('does not render the "progress is saved" pill', () => {
    render(<StartPage {...baseProps} />);
    expect(screen.queryByText(/progress is saved/i)).not.toBeInTheDocument();
  });

  it('omits the minutes tile when there is no time limit', () => {
    render(<StartPage {...baseProps} timeLimit={0} />);
    expect(screen.queryByText(/minutes/i)).not.toBeInTheDocument();
  });

  it('emits onStart when the CTA is clicked', () => {
    const onStart = vi.fn();
    render(<StartPage {...baseProps} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('emits onSectionSelect from a section card', () => {
    const onSectionSelect = vi.fn();
    render(<StartPage {...baseProps} onSectionSelect={onSectionSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Concepts & Recall/i }));
    expect(onSectionSelect).toHaveBeenCalledWith(1);
  });
});
