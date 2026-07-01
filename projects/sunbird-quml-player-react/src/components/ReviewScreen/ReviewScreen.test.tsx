import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { ReviewScreen } from './ReviewScreen';
import type { Question, Section, AnswersMap } from '../../types';

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

const mkSection = (id: string, name: string, children: Question[]): Section => ({
  identifier: id,
  name,
  children,
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
});

const sections = [
  mkSection('s1', 'Section One', [questions[0]]),
  mkSection('s2', 'Section Two', [questions[1]]),
];

const wrap = (ui: ReactNode) => render(<QumlProvider>{ui}</QumlProvider>);

describe('ReviewScreen', () => {
  it('renders the section sidebar and the first question verdict (correct)', () => {
    wrap(<ReviewScreen questions={questions} sections={sections} answers={answers} onExit={vi.fn()} />);
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Section Two')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/^correct$/i)).toBeInTheDocument();
  });

  it('navigates to the next question and shows its verdict (incorrect)', () => {
    wrap(<ReviewScreen questions={questions} sections={sections} answers={answers} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/^incorrect$/i)).toBeInTheDocument();
  });

  it('jumps to a section from the sidebar', () => {
    wrap(<ReviewScreen questions={questions} sections={sections} answers={answers} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Section Two/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
  });

  it('is interactive in review (inputs enabled, answer can change — matches Angular)', () => {
    wrap(<ReviewScreen questions={questions} sections={sections} answers={answers} onExit={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r).not.toBeDisabled());
    // Re-answering selects the clicked option (emits upward to update Context).
    fireEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('exits back to results', () => {
    const onExit = vi.fn();
    wrap(<ReviewScreen questions={questions} sections={sections} answers={answers} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /back to results/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
