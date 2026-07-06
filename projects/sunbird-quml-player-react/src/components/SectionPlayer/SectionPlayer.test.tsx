import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { SectionPlayer } from './SectionPlayer';
import type { PlayerConfig, Question, Section } from '../../types';

// Capture ASSESS telemetry so we can assert the emitted score/maxScore pair.
const { logAnswerSubmitted } = vi.hoisted(() => ({ logAnswerSubmitted: vi.fn() }));
vi.mock('../../context/useTelemetry', () => ({
  useTelemetry: () => ({
    logOptionSelected: vi.fn(),
    logAnswerSubmitted,
    logPageViewed: vi.fn(),
  }),
}));

const cfg: PlayerConfig = { context: {}, config: { language: 'en' } };

const mcq = (id: string): Question =>
  ({
    identifier: id,
    body: `<p>${id}</p>`,
    primaryCategory: 'multiple choice question',
    maxScore: 1,
    interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    },
  }) as Question;

const section: Section = {
  identifier: 's1',
  name: 'Section 1',
  children: [mcq('q1'), mcq('q2')],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
};

const wrap = (ui: ReactNode) => render(<QumlProvider playerConfig={cfg}>{ui}</QumlProvider>);

describe('SectionPlayer', () => {
  it('renders the first question with a counter', () => {
    wrap(<SectionPlayer section={section} />);
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it('navigates to the next question and shows Submit on the last', () => {
    wrap(<SectionPlayer section={section} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('persists an answer across navigation (Context restore)', () => {
    vi.useFakeTimers();
    try {
      wrap(<SectionPlayer section={section} />);
      // answer Q1 correctly → Next shows feedback briefly, then auto-advances
      fireEvent.click(screen.getAllByRole('radio')[0]);
      expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
      // Back to Q1 (immediate) — its answer is restored from Context.
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows feedback on the current question, then auto-advances (non-blocking)', () => {
    vi.useFakeTimers();
    try {
      wrap(<SectionPlayer section={section} />);
      fireEvent.click(screen.getAllByRole('radio')[1]); // answer Q1 incorrectly (correct = 0)
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      // Toast shows on the CURRENT question (still Q1) during the dwell.
      expect(screen.getByRole('status')).toHaveTextContent(/wrong answer/i);
      expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
      // After the dwell it clears and advances (does not block).
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onSectionEnd when Submit is clicked', () => {
    const onSectionEnd = vi.fn();
    wrap(<SectionPlayer section={section} onSectionEnd={onSectionEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSectionEnd).toHaveBeenCalledTimes(1);
  });

  it('ASSESS telemetry emits earned marks (fraction × maxScore), not the fraction', () => {
    logAnswerSubmitted.mockClear();
    // A 2-mark MCQ, answered correctly → fraction 1 → earned 2 (must match results).
    const q2 = { ...mcq('q1'), maxScore: 2 } as Question;
    const twoMarkSection: Section = { ...section, children: [q2, mcq('q2')] };
    wrap(<SectionPlayer section={twoMarkSection} />);
    fireEvent.click(screen.getAllByRole('radio')[0]); // correct option (value 0)
    expect(logAnswerSubmitted).toHaveBeenLastCalledWith('q1', expect.anything(), 2, 2);
  });
});
