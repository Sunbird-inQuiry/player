import { describe, it, expect } from 'vitest';
import {
  canGoToNextQuestion,
  canGoToPreviousQuestion,
  isFirstQuestion,
  isLastQuestion,
  getNextQuestionIndex,
  shouldAutoAdvance,
  isBookmarkable,
  isQuestionSkippable,
} from './navigation-service';
import type { Question } from '../types';

const makeQuestions = (n: number): Question[] =>
  Array.from({ length: n }, (_, i) => ({
    identifier: `q${i}`,
    body: '',
    primaryCategory: 'multiple choice question',
    maxScore: 1,
  }));

describe('NavigationService', () => {
  const questions = makeQuestions(3);

  it('canGoToNextQuestion respects bounds', () => {
    expect(canGoToNextQuestion(0, questions)).toBe(true);
    expect(canGoToNextQuestion(2, questions)).toBe(false);
  });

  it('canGoToNextQuestion honors requireAnswer', () => {
    expect(canGoToNextQuestion(0, questions, {}, { requireAnswer: true })).toBe(false);
    expect(
      canGoToNextQuestion(0, questions, { q0: { answer: 'A' } }, { requireAnswer: true }),
    ).toBe(true);
  });

  it('previous / first / last helpers', () => {
    expect(canGoToPreviousQuestion(0)).toBe(false);
    expect(canGoToPreviousQuestion(1)).toBe(true);
    expect(isFirstQuestion(0)).toBe(true);
    expect(isLastQuestion(2, questions)).toBe(true);
  });

  it('getNextQuestionIndex clamps to range', () => {
    expect(getNextQuestionIndex(0, questions, 1)).toBe(1);
    expect(getNextQuestionIndex(2, questions, 1)).toBe(2);
    expect(getNextQuestionIndex(0, questions, -1)).toBe(0);
  });

  it('shouldAutoAdvance only for FTB', () => {
    const ftb = { primaryCategory: 'fill in the blank question' } as Question;
    expect(shouldAutoAdvance(ftb)).toBe(true);
    expect(shouldAutoAdvance(questions[0])).toBe(false);
  });

  it('bookmarkable and skippable', () => {
    expect(isBookmarkable(questions[0])).toBe(true);
    expect(isQuestionSkippable({ allowSkip: true })).toBe(true);
    expect(isQuestionSkippable({ allowSkip: 'Yes' })).toBe(true);
    expect(isQuestionSkippable({ allowSkip: false })).toBe(false);
    expect(isQuestionSkippable(null)).toBe(false);
  });
});
