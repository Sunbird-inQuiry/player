import { describe, it, expect } from 'vitest';
import {
  calculateMCQScore,
  calculateFTBScore,
  calculateMTFScore,
  calculateOrderedScore,
} from './score';
import type { Question } from '../types';

describe('score utils', () => {
  it('calculates MCQ score for single cardinality', () => {
    const question = {
      responseDeclaration: { correctResponse: { value: 'A' } },
    } as Question;

    expect(calculateMCQScore(question, { answer: 'A' }, { cardinality: 'single' })).toBe(1);
    expect(calculateMCQScore(question, { answer: 'B' }, { cardinality: 'single' })).toBe(0);
    expect(calculateMCQScore(question, null, { cardinality: 'single' })).toBe(0);
  });

  it('calculates MCQ score for multiple cardinality (exact set match)', () => {
    const question = {
      responseDeclaration: { correctResponse: { value: ['A', 'B'] } },
    } as Question;

    expect(calculateMCQScore(question, { answer: ['A', 'B'] }, { cardinality: 'multiple' })).toBe(1);
    expect(calculateMCQScore(question, { answer: ['A'] }, { cardinality: 'multiple' })).toBe(0);
    expect(calculateMCQScore(question, { answer: ['A', 'C'] }, { cardinality: 'multiple' })).toBe(0);
  });

  it('calculates partial FTB score', () => {
    const question = {
      responseDeclaration: {
        mapping: [
          { placeholder: 'response1', correctResponse: { value: 'paris' } },
          { placeholder: 'response2', correctResponse: { value: 'rome' } },
        ],
      },
    } as Question;

    expect(calculateFTBScore(question, { response1: 'Paris', response2: 'Rome' })).toBe(1);
    expect(calculateFTBScore(question, { response1: ' paris ', response2: 'wrong' })).toBe(0.5);
    expect(calculateFTBScore(question, {})).toBe(0);
  });

  it('calculates partial MTF score', () => {
    const question = {
      responseDeclaration: { correctResponse: { value: { option1: 'a', option2: 'b' } } },
    } as Question;

    expect(calculateMTFScore(question, { option1: 'a', option2: 'b' })).toBe(1);
    expect(calculateMTFScore(question, { option1: 'a', option2: 'x' })).toBe(0.5);
  });

  it('calculates ordered (SEQ/REO) score as exact match', () => {
    const question = {
      responseDeclaration: { correctResponse: { value: ['x', 'y', 'z'] } },
    } as Question;

    expect(calculateOrderedScore(question, { answer: ['x', 'y', 'z'] })).toBe(1);
    expect(calculateOrderedScore(question, { answer: ['x', 'z', 'y'] })).toBe(0);
    expect(calculateOrderedScore(question, { answer: ['x', 'y'] })).toBe(0);
  });
});
