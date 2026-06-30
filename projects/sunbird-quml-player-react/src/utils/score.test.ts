import { describe, it, expect } from 'vitest';
import {
  calculateMCQScore,
  calculateFTBScore,
  calculateMTFScore,
  calculateOrderedScore,
} from './score';
import type { Question } from '../types';

const q = (responseDeclaration: Question['responseDeclaration']): Question =>
  ({ identifier: 'q', body: '', primaryCategory: 'x', maxScore: 1, responseDeclaration }) as Question;

describe('score utils', () => {
  it('calculates MCQ single (cardinality from responseDeclaration)', () => {
    const question = q({
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    });
    expect(calculateMCQScore(question, { value: 0 })).toBe(1);
    expect(calculateMCQScore(question, { value: 1 })).toBe(0);
    expect(calculateMCQScore(question, null)).toBe(0);
  });

  it('calculates MCQ multiple (exact set match)', () => {
    const question = q({
      response1: { cardinality: 'multiple', type: 'integer', correctResponse: { value: [0, 2] } },
    });
    expect(calculateMCQScore(question, { values: [0, 2] })).toBe(1);
    expect(calculateMCQScore(question, { values: [2, 0] })).toBe(1);
    expect(calculateMCQScore(question, { values: [0] })).toBe(0);
    expect(calculateMCQScore(question, { values: [0, 1] })).toBe(0);
  });

  it('calculates partial FTB score (correctResponse.value, case-insensitive)', () => {
    const question = q({
      response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'Paris' } },
      response2: { cardinality: 'single', type: 'string', correctResponse: { value: 'Rome' } },
    });
    expect(calculateFTBScore(question, { responses: { response1: 'paris', response2: 'rome' } })).toBe(1);
    expect(calculateFTBScore(question, { responses: { response1: ' Paris ', response2: 'wrong' } })).toBe(0.5);
    expect(calculateFTBScore(question, { responses: {} })).toBe(0);
    expect(calculateFTBScore(question, null)).toBe(0);
  });

  it('honors FTB mapping with caseSensitive', () => {
    const question = q({
      response1: {
        cardinality: 'single',
        type: 'string',
        mapping: [{ value: 'NaCl', score: 1, caseSensitive: true }],
      },
    });
    expect(calculateFTBScore(question, { responses: { response1: 'NaCl' } })).toBe(1);
    expect(calculateFTBScore(question, { responses: { response1: 'nacl' } })).toBe(0);
  });

  it('calculates partial MTF score from correctResponse map', () => {
    const question = q({
      response1: { cardinality: 'single', type: 'map', correctResponse: { value: { A: '1', B: '2' } } },
    });
    expect(calculateMTFScore(question, { matches: { A: '1', B: '2' } })).toBe(1);
    expect(calculateMTFScore(question, { matches: { A: '1', B: 'x' } })).toBe(0.5);
    expect(calculateMTFScore(question, null)).toBe(0);
  });

  it('calculates MTF score from mapping when present', () => {
    const question = q({
      response1: {
        cardinality: 'single',
        type: 'map',
        mapping: [
          { key: 'A', value: '1', score: 0.5 },
          { key: 'B', value: '2', score: 0.5 },
        ],
      },
    });
    expect(calculateMTFScore(question, { matches: { A: '1', B: '2' } })).toBe(1);
    expect(calculateMTFScore(question, { matches: { A: '1', B: '9' } })).toBe(0.5);
  });

  it('calculates ordered (SEQ/REO) score as exact match', () => {
    const question = q({
      response1: { cardinality: 'ordered', type: 'string', correctResponse: { value: ['x', 'y', 'z'] } },
    });
    expect(calculateOrderedScore(question, { order: ['x', 'y', 'z'] })).toBe(1);
    expect(calculateOrderedScore(question, { order: ['x', 'z', 'y'] })).toBe(0);
    expect(calculateOrderedScore(question, { order: ['x', 'y'] })).toBe(0);
    expect(calculateOrderedScore(question, null)).toBe(0);
  });
});
