import {
  calculateMCQScore,
  calculateFTBScore,
  calculateMTFScore,
  calculateOrderedScore,
  calculateSubjectiveScore,
} from '../utils/score';
import type { Question, UserResponse } from '../types';

/**
 * Scoring Registry — maps primaryCategory → scoring function.
 * Parallels the question-type registry; used by the orchestrator (Phase 5)
 * instead of a switch statement. Scoring logic itself lives in `utils/score`.
 */
export type ScoreFn = (question: Question, response: UserResponse | null) => number;

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

/** Calculate a score using the registry (no switch statement). */
export function calculateScore(question: Question, response: UserResponse | null): number {
  const scoreFn = getScoringFunction(question.primaryCategory);
  if (!scoreFn) return 0;
  return scoreFn(question, response);
}
