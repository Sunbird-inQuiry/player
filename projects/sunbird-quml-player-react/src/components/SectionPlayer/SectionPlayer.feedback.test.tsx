import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { SectionPlayer } from './SectionPlayer';
import type { PlayerConfig, Question, Section } from '../../types';

// Control the score so we can drive the correct/partial/incorrect feedback
// branches without building type-specific (e.g. MTF drag) interactions.
const { calculateScore } = vi.hoisted(() => ({ calculateScore: vi.fn() }));
vi.mock('../../registry/scoring-registry', () => ({ calculateScore }));
vi.mock('../../context/useTelemetry', () => ({
  useTelemetry: () => ({
    logOptionSelected: vi.fn(),
    logAnswerSubmitted: vi.fn(),
    logPageViewed: vi.fn(),
  }),
}));

const mcq = (id: string, extra: Partial<Question> = {}): Question =>
  ({
    identifier: id,
    body: `<p>${id}</p>`,
    primaryCategory: 'multiple choice question',
    maxScore: 1,
    interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    },
    ...extra,
  }) as Question;

const makeSection = (q: Question, extra: Partial<Section> = {}): Section => ({
  identifier: 's1',
  name: 'Section 1',
  children: [q, mcq('q2')],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
  ...extra,
});

const cfg = (showFeedback?: boolean): PlayerConfig => ({
  context: {},
  config: { language: 'en', ...(showFeedback === undefined ? {} : { showFeedback }) },
});

const wrap = (ui: ReactNode, config = cfg()) =>
  render(<QumlProvider playerConfig={config}>{ui}</QumlProvider>);

const answerAndNext = () => {
  fireEvent.click(screen.getAllByRole('radio')[0]);
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
};

describe('SectionPlayer feedback verdict', () => {
  beforeEach(() => {
    calculateScore.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows PARTIAL feedback for 0 < score < 1 (regression: was "Wrong Answer")', () => {
    calculateScore.mockReturnValue(0.5);
    wrap(<SectionPlayer section={makeSection(mcq('q1'))} />);
    answerAndNext();
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/partial score/i);
    expect(toast).not.toHaveTextContent(/wrong answer/i);
  });

  it('shows CORRECT feedback for score >= 1', () => {
    calculateScore.mockReturnValue(1);
    wrap(<SectionPlayer section={makeSection(mcq('q1'))} />);
    answerAndNext();
    expect(screen.getByRole('status')).toHaveTextContent(/correct answer/i);
  });

  it('shows INCORRECT feedback for score 0', () => {
    calculateScore.mockReturnValue(0);
    wrap(<SectionPlayer section={makeSection(mcq('q1'))} />);
    answerAndNext();
    expect(screen.getByRole('status')).toHaveTextContent(/wrong answer/i);
  });

  it('suppresses feedback when the question opts out (showFeedback: false)', () => {
    calculateScore.mockReturnValue(0);
    wrap(<SectionPlayer section={makeSection(mcq('q1', { showFeedback: false }))} />);
    answerAndNext();
    // No toast; advances immediately.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
  });

  it('still shows feedback when question showFeedback is undefined (unauthored)', () => {
    calculateScore.mockReturnValue(1);
    wrap(<SectionPlayer section={makeSection(mcq('q1'))} />);
    answerAndNext();
    expect(screen.getByRole('status')).toHaveTextContent(/correct answer/i);
  });

  it('suppresses feedback when the section opts out (showFeedback: false)', () => {
    calculateScore.mockReturnValue(0);
    wrap(<SectionPlayer section={makeSection(mcq('q1'), { showFeedback: false })} />);
    answerAndNext();
    // No toast; advances immediately.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
  });
});
