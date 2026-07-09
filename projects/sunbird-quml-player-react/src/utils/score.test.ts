import { describe, it, expect } from 'vitest';
import {
  calculateMCQScore,
  calculateFTBScore,
  calculateMTFScore,
  calculateOrderedScore,
} from './score';
import type { Question } from '../types';

/** Build a Question with a given responseDeclaration + optional scoring hints. */
const mk = (
  responseDeclaration: Question['responseDeclaration'],
  opts: { maxScore?: number; mapResponse?: boolean; evalUnordered?: boolean } = {},
): Question => {
  const maxScore = opts.maxScore ?? 1;
  return {
    identifier: 'q',
    body: '',
    primaryCategory: 'x',
    maxScore,
    outcomeDeclaration: { maxScore: { defaultValue: maxScore } },
    responseDeclaration,
    ...(opts.mapResponse ? { responseProcessing: { template: 'MAP_RESPONSE' } } : {}),
    ...(opts.evalUnordered ? { evalUnordered: true } : {}),
  } as Question;
};

describe('score utils (Angular evaluateAutoScored parity, normalized to 0..1)', () => {
  it('MCQ single: full for the correct option, else 0', () => {
    const q = mk({
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    });
    expect(calculateMCQScore(q, { value: 0 })).toBe(1);
    expect(calculateMCQScore(q, { value: 1 })).toBe(0);
    expect(calculateMCQScore(q, null)).toBe(0);
  });

  it('MCQ single: a mapped non-correct option earns its mapping score', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'single',
          type: 'integer',
          correctResponse: { value: 0 },
          mapping: [{ value: 1, score: 0.25 }],
        },
      },
      { maxScore: 1 },
    );
    expect(calculateMCQScore(q, { value: 0 })).toBe(1);
    expect(calculateMCQScore(q, { value: 1 })).toBe(0.25);
    expect(calculateMCQScore(q, { value: 2 })).toBe(0);
  });

  // ── MTF (map) ──────────────────────────────────────────────────────────────
  it('MTF MAP_RESPONSE: per-item scores, full credit on complete match', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'single',
          type: 'map',
          mapping: [
            { key: 'a', value: '1', score: 2 },
            { key: 'b', value: '2', score: 3 },
          ],
        },
      },
      { maxScore: 5, mapResponse: true },
    );
    expect(calculateMTFScore(q, { matches: { a: '1', b: '2' } })).toBe(1); // earned 5/5
    expect(calculateMTFScore(q, { matches: { a: '1', b: 'wrong' } })).toBe(2 / 5); // earned 2
    expect(calculateMTFScore(q, null)).toBe(0);
  });

  it('MTF MAP_RESPONSE: caps the summed score at maxScore', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'single',
          type: 'map',
          mapping: [
            { key: 'a', value: '1', score: 3 },
            { key: 'b', value: '2', score: 3 },
          ],
        },
      },
      { maxScore: 4, mapResponse: true },
    );
    expect(calculateMTFScore(q, { matches: { a: '1', b: '2' } })).toBe(1); // min(6,4)/4
  });

  it('MTF legacy: proportional round(maxScore × hits/total)', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'single',
          type: 'map',
          correctResponse: { value: { a: '1', b: '2', c: '3', d: '4' } },
        },
      },
      { maxScore: 10 },
    );
    // 2 of 4 → round(10 × 0.5) = 5 → 0.5
    expect(calculateMTFScore(q, { matches: { a: '1', b: '2', c: 'x', d: 'y' } })).toBe(0.5);
  });

  // ── FTB (ftb) ────────────────────────────────────────────────────────────
  it('FTB MAP_RESPONSE: scores each blank against its own mapping', () => {
    const q = mk(
      {
        response1: { cardinality: 'single', type: 'string', mapping: [{ value: 'cat', score: 1 }] },
        response2: { cardinality: 'single', type: 'string', mapping: [{ value: 'dog', score: 1 }] },
      },
      { maxScore: 2, mapResponse: true },
    );
    expect(calculateFTBScore(q, { responses: { response1: 'cat', response2: 'dog' } })).toBe(1);
    expect(calculateFTBScore(q, { responses: { response1: 'cat', response2: 'x' } })).toBe(0.5);
  });

  it('FTB MAP_RESPONSE: honours caseSensitive mappings', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'single',
          type: 'string',
          mapping: [{ value: 'Cat', score: 1, caseSensitive: true }],
        },
      },
      { maxScore: 1, mapResponse: true },
    );
    expect(calculateFTBScore(q, { responses: { response1: 'cat' } })).toBe(0);
    expect(calculateFTBScore(q, { responses: { response1: 'Cat' } })).toBe(1);
  });

  it('FTB evalUnordered: each distinct correct answer credited once', () => {
    const mapping = [
      { value: 'red', score: 1 },
      { value: 'blue', score: 1 },
    ];
    const q = mk(
      {
        response1: { cardinality: 'single', type: 'string', mapping },
        response2: { cardinality: 'single', type: 'string', mapping },
      },
      { maxScore: 2, mapResponse: true, evalUnordered: true },
    );
    // Answers in opposite order → still full credit.
    expect(calculateFTBScore(q, { responses: { response1: 'blue', response2: 'red' } })).toBe(1);
    // Same answer twice → credited once.
    expect(calculateFTBScore(q, { responses: { response1: 'red', response2: 'red' } })).toBe(0.5);
  });

  it('FTB legacy: proportional round(maxScore × hits/total)', () => {
    const q = mk(
      {
        response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'cat' } },
        response2: { cardinality: 'single', type: 'string', correctResponse: { value: 'dog' } },
      },
      { maxScore: 4 },
    );
    // 1 of 2 → round(4 × 0.5) = 2 → 0.5
    expect(calculateFTBScore(q, { responses: { response1: 'cat', response2: 'fish' } })).toBe(0.5);
    expect(calculateFTBScore(q, null)).toBe(0);
  });

  // ── SEQ / REO (ordered) ──────────────────────────────────────────────────
  it('ordered MAP_RESPONSE: position from correctResponse, score from mapping', () => {
    const q = mk(
      {
        response1: {
          cardinality: 'ordered',
          type: 'string',
          correctResponse: { value: ['a', 'b', 'c'] },
          mapping: [
            { value: 'a', score: 1 },
            { value: 'b', score: 2 },
            { value: 'c', score: 3 },
          ],
        },
      },
      { maxScore: 6, mapResponse: true },
    );
    expect(calculateOrderedScore(q, { order: ['a', 'b', 'c'] })).toBe(1); // 6/6
    expect(calculateOrderedScore(q, { order: ['a', 'c', 'b'] })).toBeCloseTo(1 / 6); // only 'a'
  });

  it('ordered legacy: all-or-nothing', () => {
    const q = mk(
      {
        response1: { cardinality: 'ordered', type: 'string', correctResponse: { value: ['a', 'b', 'c'] } },
      },
      { maxScore: 5 },
    );
    expect(calculateOrderedScore(q, { order: ['a', 'b', 'c'] })).toBe(1);
    expect(calculateOrderedScore(q, { order: ['a', 'c', 'b'] })).toBe(0);
    expect(calculateOrderedScore(q, { order: ['a', 'b'] })).toBe(0);
    expect(calculateOrderedScore(q, null)).toBe(0);
  });

  it('ordered (REO) i18n: scores against the language-specific correct order', () => {
    // English correct order = A..F (6); Arabic = A,B,C (3). Same question, per
    // the reo-i18n payload where the option/word set differs by language.
    const q = mk({
      response1: {
        cardinality: 'ordered',
        type: 'string',
        correctResponse: { value: ['A', 'B', 'C', 'D', 'E', 'F'] },
        i18n: {
          en: { correctResponse: { value: ['A', 'B', 'C', 'D', 'E', 'F'] } },
          ar: { correctResponse: { value: ['A', 'B', 'C'] } },
        },
      },
    });

    // Arabic answer (3 words) scored WITH language → matches the Arabic order.
    expect(calculateOrderedScore(q, { order: ['A', 'B', 'C'] }, 'ar')).toBe(1);
    expect(calculateOrderedScore(q, { order: ['A', 'C', 'B'] }, 'ar')).toBe(0);

    // The bug this fixes: the same Arabic answer WITHOUT language falls back to
    // the English 6-item order → length mismatch → wrongly 0.
    expect(calculateOrderedScore(q, { order: ['A', 'B', 'C'] })).toBe(0);

    // English answer still scores against the English order.
    expect(calculateOrderedScore(q, { order: ['A', 'B', 'C', 'D', 'E', 'F'] }, 'en')).toBe(1);

    // Unknown language → falls back to the top-level (English) order.
    expect(calculateOrderedScore(q, { order: ['A', 'B', 'C', 'D', 'E', 'F'] }, 'zz')).toBe(1);
  });
});
