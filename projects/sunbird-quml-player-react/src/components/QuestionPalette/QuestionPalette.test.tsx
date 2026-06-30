import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionPalette, getQuestionStatus } from './QuestionPalette';
import type { Question, AnswersMap } from '../../types';

const mk = (id: string, category = 'multiple choice question'): Question => ({
  identifier: id,
  body: '',
  primaryCategory: category,
  maxScore: 1,
});

const questions = [mk('q1'), mk('q2'), mk('q3', 'subjective question'), mk('q4')];

describe('getQuestionStatus', () => {
  const answers: AnswersMap = { q1: { value: 0 }, q3: { value: 0 } };
  it('derives status from index + answers', () => {
    expect(getQuestionStatus(questions[0], 0, 2, answers)).toBe('answered');
    expect(getQuestionStatus(questions[1], 1, 1, answers)).toBe('current'); // index===current
    expect(getQuestionStatus(questions[1], 1, 2, {})).toBe('skipped'); // visited, no answer
    expect(getQuestionStatus(questions[3], 3, 2, {})).toBe('unanswered'); // not visited
    expect(getQuestionStatus(questions[2], 2, 0, answers)).toBe('needs-review'); // SA answered
  });
});

describe('QuestionPalette', () => {
  it('renders a chip per question and emits jump', () => {
    const onJump = vi.fn();
    render(
      <QuestionPalette
        questions={questions}
        currentIndex={0}
        answers={{ q1: { value: 0 } }}
        onJump={onJump}
      />,
    );
    const chips = screen.getAllByRole('button');
    expect(chips).toHaveLength(4);
    expect(chips[0]).toHaveAttribute('aria-current', 'true'); // current
    fireEvent.click(chips[2]);
    expect(onJump).toHaveBeenCalledWith(2);
  });
});
