import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('hides the answer behind a Show Answer button by default', () => {
    render(<SaQuestion question={saQuestion} />);
    const reveal = screen.getByRole('button', { name: /show answer/i });
    expect(reveal).toBeInTheDocument();
    expect(reveal).toHaveAttribute('aria-expanded', 'false');
    // Answer text is present in the DOM but hidden from AT (blurred).
    const answer = screen.getByText('Plants convert light to energy.');
    expect(answer.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('reveals the answer when Show Answer is clicked', () => {
    render(<SaQuestion question={saQuestion} />);
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
    // Button is gone; Question/Answer labels and answer are now visible.
    expect(screen.queryByRole('button', { name: /show answer/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^question$/i)).toBeInTheDocument();
    expect(screen.getByText(/^answer$/i)).toBeInTheDocument();
    const answer = screen.getByText('Plants convert light to energy.');
    expect(answer.closest('[aria-hidden="true"]')).toBeNull();
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
