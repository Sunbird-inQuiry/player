import type { Question, UserResponse } from '../types';

/**
 * Calculate score for an MCQ question.
 * @param options - { cardinality: 'single' | 'multiple' }
 * @returns Score (0 or 1)
 */
export function calculateMCQScore(
  question: Question,
  response: UserResponse | null,
  options: { cardinality?: string } = {},
): number {
  const { cardinality = 'single' } = options;

  if (!response || !response.answer) {
    return 0;
  }

  const correctAnswer = question.responseDeclaration?.correctResponse?.value;
  if (!correctAnswer) {
    return 0;
  }

  if (cardinality === 'single') {
    return response.answer === correctAnswer ? 1 : 0;
  }

  if (cardinality === 'multiple') {
    // For multiple, check if user selected exactly the correct options
    const userAnswers = Array.isArray(response.answer) ? response.answer : [response.answer];
    const correct = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    const userSet = new Set<unknown>(userAnswers);
    const correctSet = new Set<unknown>(correct);

    if (userSet.size !== correctSet.size) {
      return 0;
    }

    for (const answer of userSet) {
      if (!correctSet.has(answer)) {
        return 0;
      }
    }

    return 1;
  }

  return 0;
}

/**
 * Calculate score for FTB (Fill The Blank). Partial scoring (0..1).
 */
export function calculateFTBScore(question: Question, response: UserResponse | null): number {
  if (!response || Object.keys(response).length === 0) {
    return 0;
  }

  const correctMapping = question.responseDeclaration?.mapping || [];
  let correctCount = 0;
  let totalBlanks = 0;

  for (const mapping of correctMapping) {
    totalBlanks += 1;
    const userAnswer = response[mapping.placeholder];

    // Case-insensitive comparison, trim whitespace
    const trimmedUser = String(userAnswer ?? '').trim().toLowerCase();
    const trimmedCorrect = mapping.correctResponse.value.toLowerCase();

    if (trimmedUser === trimmedCorrect) {
      correctCount += 1;
    }
  }

  return totalBlanks > 0 ? correctCount / totalBlanks : 0;
}

/**
 * Calculate score for MTF (Match The Following). Partial scoring (0..1).
 */
export function calculateMTFScore(question: Question, response: UserResponse | null): number {
  if (!response || Object.keys(response).length === 0) {
    return 0;
  }

  const correctMapping = (question.responseDeclaration?.correctResponse?.value || {}) as Record<
    string,
    string
  >;
  let correctCount = 0;
  const totalMatches = Object.keys(correctMapping).length;

  for (const [key, correctMatch] of Object.entries(correctMapping)) {
    if (response[key] === correctMatch) {
      correctCount += 1;
    }
  }

  return totalMatches > 0 ? correctCount / totalMatches : 0;
}

/**
 * Calculate score for SEQ/REO (Sequence/Reorder). 0 or 1 for exact match.
 */
export function calculateOrderedScore(question: Question, response: UserResponse | null): number {
  if (!response || !response.answer) {
    return 0;
  }

  const correctOrder = (question.responseDeclaration?.correctResponse?.value || []) as string[];
  const userOrder = (response.answer || []) as string[];

  if (userOrder.length !== correctOrder.length) {
    return 0;
  }

  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] !== correctOrder[i]) {
      return 0;
    }
  }

  return 1;
}
