import type { Question, AnswersMap } from '../types';

/**
 * Navigation Service - Centralized navigation rules and helpers
 *
 * Single Responsibility: Answer all navigation questions:
 * - Can user go to next/previous question?
 * - Are we on the first/last question?
 * - Should we auto-advance after answer?
 * - Is this question bookmarkable / skippable?
 *
 * Used by: SectionPlayer, MainPlayer
 */

/**
 * Check if user can go to the next question.
 * When options.requireAnswer is true, the current question must be answered.
 */
export function canGoToNextQuestion(
  currentIndex: number,
  questions: Question[],
  answers: AnswersMap = {},
  options: { requireAnswer?: boolean } = {},
): boolean {
  const { requireAnswer = false } = options;

  // Can't go next if already at last question
  if (currentIndex >= questions.length - 1) {
    return false;
  }

  // If requireAnswer is true, user must answer current question
  if (requireAnswer) {
    const currentQuestion = questions[currentIndex];
    const hasAnswer = answers[currentQuestion.identifier];
    return !!hasAnswer;
  }

  return true;
}

/** Check if user can go to the previous question. */
export function canGoToPreviousQuestion(currentIndex: number): boolean {
  return currentIndex > 0;
}

/** Check if we're at the first question. */
export function isFirstQuestion(currentIndex: number): boolean {
  return currentIndex === 0;
}

/** Check if we're at the last question. */
export function isLastQuestion(currentIndex: number, questions: Question[]): boolean {
  return currentIndex === questions.length - 1;
}

/**
 * Calculate the next question index (clamped to range).
 * @param step - 1 for next, -1 for previous (default 1)
 */
export function getNextQuestionIndex(
  currentIndex: number,
  questions: Question[],
  step = 1,
): number {
  const newIndex = currentIndex + step;
  return Math.max(0, Math.min(newIndex, questions.length - 1));
}

/**
 * Should we auto-advance to the next question after this answer?
 * (FTB questions typically auto-advance after the last blank.)
 */
export function shouldAutoAdvance(question: Question | null | undefined): boolean {
  return question?.primaryCategory?.toLowerCase() === 'fill in the blank question';
}

/** Check if a question can be bookmarked (all questions are, by default). */
export function isBookmarkable(_question: Question): boolean {
  return true;
}

/**
 * Check if questions in a section are skippable.
 * Accepts both the normalized (boolean) and raw ('Yes') allowSkip forms.
 */
export function isQuestionSkippable(
  section: { allowSkip?: boolean | string } | null | undefined,
): boolean {
  return section?.allowSkip === true || section?.allowSkip === 'Yes';
}
