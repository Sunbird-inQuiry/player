import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsScreen } from './ResultsScreen';

const summary = { correct: 6, incorrect: 2, partial: 1, skipped: 0, totalScore: 7, maxScore: 10 };

describe('ResultsScreen', () => {
  it('shows the percentage ring and reuses the Scoreboard stat card', () => {
    render(<ResultsScreen summary={summary} onReviewAll={vi.fn()} onRetake={vi.fn()} />);
    expect(screen.getByText('70%')).toBeInTheDocument(); // 7/10
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
    // Reused Scoreboard must NOT render its own Submit button here.
    expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
  });

  it('fires Review-all and Retake', () => {
    const onReviewAll = vi.fn();
    const onRetake = vi.fn();
    render(<ResultsScreen summary={summary} onReviewAll={onReviewAll} onRetake={onRetake} />);
    fireEvent.click(screen.getByRole('button', { name: /review all/i }));
    fireEvent.click(screen.getByRole('button', { name: /retake/i }));
    expect(onReviewAll).toHaveBeenCalledTimes(1);
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it('handles a zero max score without dividing by zero', () => {
    render(
      <ResultsScreen
        summary={{ ...summary, totalScore: 0, maxScore: 0 }}
        onReviewAll={vi.fn()}
        onRetake={vi.fn()}
      />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
