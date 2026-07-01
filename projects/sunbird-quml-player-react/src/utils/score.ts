import type { Question, UserResponse, ResponseDeclarationItem } from '../types';

/** Get the first responseN declaration (most question types have exactly one). */
function firstResponse(question: Question): ResponseDeclarationItem | undefined {
  const rd = question.responseDeclaration;
  if (!rd) return undefined;
  const keys = Object.keys(rd);
  return keys.length ? rd[keys[0]] : undefined;
}

/**
 * Calculate score for an MCQ question (0 or 1).
 * Cardinality is read from the responseDeclaration; `options.cardinality` overrides.
 */
export function calculateMCQScore(
  question: Question,
  response: UserResponse | null,
  options: { cardinality?: string } = {},
): number {
  if (!response) return 0;

  const decl = firstResponse(question);
  if (!decl) return 0;

  const cardinality = options.cardinality ?? decl.cardinality ?? 'single';
  const correct = decl.correctResponse?.value;
  if (correct === undefined || correct === null) return 0;

  if (cardinality === 'single') {
    if (response.value === undefined || response.value === null) return 0;
    return response.value === correct ? 1 : 0;
  }

  if (cardinality === 'multiple') {
    const userValues = response.values ?? [];
    const correctValues = Array.isArray(correct) ? correct : [correct];
    if (userValues.length === 0) return 0;

    const userSet = new Set<unknown>(userValues);
    const correctSet = new Set<unknown>(correctValues);
    if (userSet.size !== correctSet.size) return 0;
    for (const v of userSet) {
      if (!correctSet.has(v)) return 0;
    }
    return 1;
  }

  return 0;
}

/**
 * Calculate score for FTB (Fill The Blank). Partial scoring (0..1).
 * One blank per responseN; per-blank `mapping` (QuML 1.1) takes precedence,
 * else compares to `correctResponse.value`.
 */
export function calculateFTBScore(question: Question, response: UserResponse | null): number {
  const rd = question.responseDeclaration;
  const responses = response?.responses;
  if (!rd || !responses) return 0;

  const keys = Object.keys(rd);
  if (keys.length === 0) return 0;

  let correctCount = 0;
  for (const key of keys) {
    const decl = rd[key];
    const userAnswer = String(responses[key] ?? '').trim();
    const mapping = decl.mapping;

    let isCorrect = false;
    if (mapping && mapping.length) {
      isCorrect = mapping.some((m) => {
        const expected = String(m.value ?? '').trim();
        return m.caseSensitive === true
          ? userAnswer === expected
          : userAnswer.toLowerCase() === expected.toLowerCase();
      });
    } else if (typeof decl.correctResponse?.value === 'string') {
      const expected = decl.correctResponse.value.trim();
      isCorrect = userAnswer.toLowerCase() === expected.toLowerCase();
    }

    if (isCorrect) correctCount += 1;
  }

  return correctCount / keys.length;
}

/**
 * Calculate score for MTF (Match The Following). Partial scoring (0..1).
 * Uses `mapping` ({key,value,score}) when present, else `correctResponse.value`
 * as a { leftValue: rightValue } map.
 */
export function calculateMTFScore(question: Question, response: UserResponse | null): number {
  const decl = firstResponse(question);
  const matches = response?.matches;
  if (!decl || !matches) return 0;

  const mapping = decl.mapping;
  if (mapping && mapping.length) {
    let correctCount = 0;
    for (const m of mapping) {
      if (m.key !== undefined && matches[m.key] === m.value) correctCount += 1;
    }
    return correctCount / mapping.length;
  }

  const correct = decl.correctResponse?.value;
  const correctMap =
    correct && typeof correct === 'object' && !Array.isArray(correct)
      ? (correct as Record<string, string>)
      : {};
  const keys = Object.keys(correctMap);
  if (keys.length === 0) return 0;

  let correctCount = 0;
  for (const k of keys) {
    if (matches[k] === correctMap[k]) correctCount += 1;
  }
  return correctCount / keys.length;
}

/**
 * Score for SA (Subjective). Subjective answers are self-assessed: revealing the
 * model answer ("Show Answer") self-marks the question correct (full score),
 * mirroring the Angular player's showAnswerClicked behavior. Otherwise 0.
 */
export function calculateSubjectiveScore(_question: Question, response: UserResponse | null): number {
  return response?.shown ? 1 : 0;
}

/**
 * Calculate score for SEQ/REO (Sequence/Reorder). 0 or 1 for exact order match.
 */
export function calculateOrderedScore(question: Question, response: UserResponse | null): number {
  const decl = firstResponse(question);
  const order = response?.order;
  if (!decl || !order) return 0;

  const correct = decl.correctResponse?.value;
  const correctOrder = Array.isArray(correct) ? (correct as Array<number | string>) : [];
  if (correctOrder.length === 0 || order.length !== correctOrder.length) return 0;

  for (let i = 0; i < order.length; i++) {
    if (order[i] !== correctOrder[i]) return 0;
  }
  return 1;
}
