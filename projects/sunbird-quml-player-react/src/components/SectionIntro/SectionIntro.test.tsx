import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionIntro } from './SectionIntro';
import type { Section } from '../../types';

const section: Section = {
  identifier: 's1',
  name: 'Knowledge Check',
  description: 'Warm-up questions',
  instructions: { en: 'Answer all questions.' },
  children: [
    { identifier: 'q1', body: '', primaryCategory: 'multiple choice question', maxScore: 1 },
    { identifier: 'q2', body: '', primaryCategory: 'multiple choice question', maxScore: 1 },
  ],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
};

describe('SectionIntro', () => {
  it('renders the section letter banner, count and instructions', () => {
    render(
      <SectionIntro section={section} sectionIndex={0} totalSections={3} onBegin={vi.fn()} />,
    );
    expect(screen.getByText(/^section a$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /2 Questions/i })).toBeInTheDocument();
    expect(screen.getByText('Answer all questions.')).toBeInTheDocument();
  });

  it('falls back to a default instruction when none is provided', () => {
    render(
      <SectionIntro
        section={{ ...section, instructions: {} }}
        sectionIndex={1}
        totalSections={3}
        onBegin={vi.fn()}
      />,
    );
    expect(screen.getByText(/all questions are mandatory/i)).toBeInTheDocument();
  });

  it('emits onBegin from the Start section CTA', () => {
    const onBegin = vi.fn();
    render(<SectionIntro section={section} sectionIndex={1} totalSections={3} onBegin={onBegin} />);
    fireEvent.click(screen.getByRole('button', { name: /start section b/i }));
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it('omits the Previous link when onPrevious is not provided', () => {
    render(<SectionIntro section={section} sectionIndex={0} totalSections={3} onBegin={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('emits onPrevious (back to the overview) from the Previous link', () => {
    const onPrevious = vi.fn();
    render(
      <SectionIntro
        section={section}
        sectionIndex={0}
        totalSections={3}
        onBegin={vi.fn()}
        onPrevious={onPrevious}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });
});
