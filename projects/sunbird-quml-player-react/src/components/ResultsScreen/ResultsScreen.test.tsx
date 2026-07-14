import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsScreen } from './ResultsScreen';

const summary = { correct: 6, incorrect: 2, partial: 1, skipped: 0, totalScore: 7, maxScore: 10 };

describe('ResultsScreen', () => {
  it('shows the earned score (no percentage, no denominator) via the Scoreboard', () => {
    render(<ResultsScreen summary={summary} onReviewAll={vi.fn()} onRetake={vi.fn()} />);
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // earned score
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
    // Reused Scoreboard must NOT render its own Submit button here.
    expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
  });

  it('shows the time taken when provided', () => {
    render(
      <ResultsScreen summary={summary} timeTaken={204} onReviewAll={vi.fn()} onRetake={vi.fn()} />,
    );
    expect(screen.getByText('3:24')).toBeInTheDocument();
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

  it('hides Retake when omitted (attempts exhausted — Angular parity: showReplay=false)', () => {
    render(<ResultsScreen summary={summary} onReviewAll={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /retake/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review all/i })).toBeInTheDocument();
  });

  // Angular parity (main-player.component.ts:488-524) — summaryType gates
  // score/duration visibility. The correct/incorrect/partial/skipped breakdown
  // has no Angular equivalent and is intentionally always shown regardless.
  describe('summaryType (Angular parity)', () => {
    it('"Complete" shows the score as a fraction', () => {
      render(
        <ResultsScreen summary={summary} summaryType="Complete" onReviewAll={vi.fn()} />,
      );
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
    });

    it('"Score" shows a plain score and hides duration', () => {
      render(
        <ResultsScreen
          summary={summary}
          summaryType="Score"
          timeTaken={204}
          onReviewAll={vi.fn()}
        />,
      );
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.queryByText(/time taken/i)).not.toBeInTheDocument();
    });

    it('"Duration" hides the score entirely', () => {
      render(
        <ResultsScreen
          summary={summary}
          summaryType="Duration"
          timeTaken={204}
          onReviewAll={vi.fn()}
        />,
      );
      expect(screen.queryByText(/^score/i)).not.toBeInTheDocument();
      expect(screen.getByText('3:24')).toBeInTheDocument();
    });

    it('"Score and Duration" (and absent) shows a plain score and duration', () => {
      render(
        <ResultsScreen
          summary={summary}
          summaryType="Score and Duration"
          timeTaken={204}
          onReviewAll={vi.fn()}
        />,
      );
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('3:24')).toBeInTheDocument();
    });

    it('always shows the correct/incorrect/partial/skipped breakdown regardless of summaryType', () => {
      render(<ResultsScreen summary={summary} summaryType="Duration" onReviewAll={vi.fn()} />);
      expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument(); // correct count
    });
  });
});
