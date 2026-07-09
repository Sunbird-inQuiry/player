import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { Section } from '../../types';

const sections: Section[] = [
  {
    identifier: 's1',
    name: 'Section One',
    description: 'Recognise the right answer',
    children: [
      { identifier: 'q1', body: '', primaryCategory: 'multiple choice question', maxScore: 1 },
      { identifier: 'q2', body: '', primaryCategory: 'multiple choice question', maxScore: 1 },
    ],
    timeLimits: { max: 0, min: 0 },
    allowSkip: true,
    shuffle: false,
  },
  {
    identifier: 's2',
    name: 'Section Two',
    description: 'Show what you remember',
    children: [
      { identifier: 'q3', body: '', primaryCategory: 'multiple choice question', maxScore: 1 },
    ],
    timeLimits: { max: 0, min: 0 },
    allowSkip: true,
    shuffle: false,
  },
];

describe('Sidebar', () => {
  it('is a nav landmark listing sections with answered/total status', () => {
    render(
      <Sidebar
        sections={sections}
        currentSectionIndex={0}
        answers={{ q1: { value: 0 } }}
        onSectionJump={vi.fn()}
      />,
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Recognise the right answer')).toBeInTheDocument();
    // Section One: 1 answered of 2 → 1 remaining. Section Two: 0 of 1 → 1 remaining.
    expect(screen.getByText('✓ 1')).toBeInTheDocument();
    expect(screen.getByText('✓ 0')).toBeInTheDocument();
    expect(screen.getAllByText('○ 1')).toHaveLength(2);
    // Active section exposed to AT.
    expect(screen.getByRole('button', { name: /Section One/i })).toHaveAttribute('aria-current', 'true');
  });

  it('emits a section jump', () => {
    const onSectionJump = vi.fn();
    render(
      <Sidebar
        sections={sections}
        currentSectionIndex={0}
        answers={{}}
        onSectionJump={onSectionJump}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Section Two/i }));
    expect(onSectionJump).toHaveBeenCalledWith(1);
  });
});
