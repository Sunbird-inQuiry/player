import { describe, it, expect } from 'vitest';
import { getScoringFunction, calculateScore, scoringRegistry } from './scoring-registry';
import type { Question } from '../types';

const mcq = {
  identifier: 'q',
  body: '',
  primaryCategory: 'multiple choice question',
  maxScore: 1,
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
  },
} as Question;

describe('scoring-registry', () => {
  it('registers a scorer for all six categories (+ ftb alias)', () => {
    [
      'multiple choice question',
      'subjective question',
      'fill in the blank question',
      'ftb question',
      'match the following question',
      'sequence question',
      'reorder question',
    ].forEach((cat) => expect(getScoringFunction(cat)).toBeTypeOf('function'));
    expect(scoringRegistry.size).toBe(7);
  });

  it('getScoringFunction is case-insensitive and null for unknown', () => {
    expect(getScoringFunction('MULTIPLE CHOICE QUESTION')).toBeTypeOf('function');
    expect(getScoringFunction('nope')).toBeNull();
    expect(getScoringFunction(undefined)).toBeNull();
  });

  it('calculateScore routes to the correct scorer', () => {
    expect(calculateScore(mcq, { value: 0 })).toBe(1);
    expect(calculateScore(mcq, { value: 1 })).toBe(0);
  });

  it('SA always scores 0', () => {
    const sa = { ...mcq, primaryCategory: 'subjective question' } as Question;
    expect(calculateScore(sa, null)).toBe(0);
  });

  it('unknown category scores 0', () => {
    const unknown = { ...mcq, primaryCategory: 'mystery' } as Question;
    expect(calculateScore(unknown, { value: 0 })).toBe(0);
  });
});
