import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { ReviewScreen } from './ReviewScreen';
import type { Question, AnswersMap } from '../../types';

const mcq = (id: string, correct: number): Question =>
  ({
    identifier: id,
    body: `<p>${id}</p>`,
    primaryCategory: 'multiple choice question',
    maxScore: 1,
    interactions: { response1: { options: [{ value: 0, label: 'A' }, { value: 1, label: 'B' }] } },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: correct } },
    },
  }) as Question;

const questions = [mcq('q1', 0), mcq('q2', 1)];
const answers: AnswersMap = { q1: { value: 0 }, q2: { value: 0 } }; // q1 correct, q2 incorrect

const wrap = (ui: ReactNode) => render(<QumlProvider>{ui}</QumlProvider>);

describe('ReviewScreen', () => {
  it('renders the palette and the first question verdict (correct)', () => {
    wrap(<ReviewScreen questions={questions} answers={answers} onExit={vi.fn()} />);
    expect(screen.getByLabelText(/question palette/i)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/^correct$/i)).toBeInTheDocument();
  });

  it('navigates to the next question and shows its verdict (incorrect)', () => {
    wrap(<ReviewScreen questions={questions} answers={answers} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/^incorrect$/i)).toBeInTheDocument();
  });

  it('locks inputs in replay (options are disabled — no mutation)', () => {
    wrap(<ReviewScreen questions={questions} answers={answers} onExit={vi.fn()} />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('exits back to results', () => {
    const onExit = vi.fn();
    wrap(<ReviewScreen questions={questions} answers={answers} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /back to results/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
