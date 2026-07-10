import {
  calculateMCQScore,
  calculateFTBScore,
  calculateMTFScore,
  calculateOrderedScore,
  calculateSubjectiveScore,
} from '../utils/score';
import { isAnswered } from '../utils/answered';
import type { Question, UserResponse } from '../types';

/**
 * Scoring Registry — maps primaryCategory → scoring function.
 * Parallels the question-type registry; used by the orchestrator (Phase 5)
 * instead of a switch statement. Scoring logic itself lives in `utils/score`.
 */
export type ScoreFn = (
  question: Question,
  response: UserResponse | null,
  language?: string,
) => number;

export const scoringRegistry = new Map<string, ScoreFn>([
  ['multiple choice question', calculateMCQScore],
  ['boolean question', calculateMCQScore],
  ['subjective question', calculateSubjectiveScore],
  ['fill in the blank question', calculateFTBScore],
  ['ftb question', calculateFTBScore],
  ['match the following question', calculateMTFScore],
  ['sequence question', calculateOrderedScore],
  ['reorder question', calculateOrderedScore],
]);

/** Get the scoring function for a question type, or null. */
export function getScoringFunction(primaryCategory: string | null | undefined): ScoreFn | null {
  if (!primaryCategory) return null;
  return scoringRegistry.get(primaryCategory.toLowerCase()) || null;
}

/**
 * Calculate a score using the registry (no switch statement).
 * An empty / unanswered response always scores 0 (single shared `isAnswered`
 * check), before any type-specific scoring runs.
 */
export function calculateScore(
  question: Question,
  response: UserResponse | null,
  language?: string,
): number {
  if (!isAnswered(response)) return 0;
  const scoreFn = getScoringFunction(question.primaryCategory);
  if (!scoreFn) return 0;
  return scoreFn(question, response, language);
}
