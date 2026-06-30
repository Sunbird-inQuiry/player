import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaQuestion } from './SaQuestion';
import type { Question } from '../../../types';

const saQuestion = {
  identifier: 'q-sa',
  body: '<p>Explain photosynthesis.</p>',
  primaryCategory: 'subjective question',
  maxScore: 5,
  answer: '<p>Plants convert light to energy.</p>',
} as Question;

describe('SaQuestion', () => {
  it('renders the question body', () => {
    render(<SaQuestion question={saQuestion} />);
    expect(screen.getByText('Explain photosynthesis.')).toBeInTheDocument();
  });

  it('renders the model answer (read-only)', () => {
    render(<SaQuestion question={saQuestion} />);
    expect(screen.getByText(/expected answer/i)).toBeInTheDocument();
    expect(screen.getByText('Plants convert light to energy.')).toBeInTheDocument();
  });

  it('does not collect/emit an answer and calls onComponentLoaded once', () => {
    const onOptionSelected = vi.fn();
    const onComponentLoaded = vi.fn();
    render(
      <SaQuestion
        question={saQuestion}
        onOptionSelected={onOptionSelected}
        onComponentLoaded={onComponentLoaded}
      />,
    );
    expect(onOptionSelected).not.toHaveBeenCalled();
    expect(onComponentLoaded).toHaveBeenCalledTimes(1);
  });
});
