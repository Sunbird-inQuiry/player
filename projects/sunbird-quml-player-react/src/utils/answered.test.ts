import { describe, it, expect } from 'vitest';
import { isAnswered } from './answered';

describe('isAnswered', () => {
  it('treats null/undefined/empty object as unanswered', () => {
    expect(isAnswered(null)).toBe(false);
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered({})).toBe(false);
  });

  it('MCQ — answered only with a real value', () => {
    expect(isAnswered({ value: 0 })).toBe(true);
    expect(isAnswered({ value: 'a' })).toBe(true);
    expect(isAnswered({ value: '' })).toBe(false);
    expect(isAnswered({ value: undefined })).toBe(false);
  });

  it('Subjective — answered only once the model answer is revealed', () => {
    expect(isAnswered({ shown: true })).toBe(true);
    expect(isAnswered({ shown: false })).toBe(false);
  });

  it('FTB — answered only when a blank has non-blank text', () => {
    expect(isAnswered({ responses: { response1: 'Paris' } })).toBe(true);
    expect(isAnswered({ responses: { response1: '  ' } })).toBe(false);
    expect(isAnswered({ responses: { response1: '' } })).toBe(false);
    expect(isAnswered({ responses: {} })).toBe(false);
  });

  it('MTF — answered when at least one pairing exists', () => {
    expect(isAnswered({ matches: { A: '1' } })).toBe(true);
    expect(isAnswered({ matches: {} })).toBe(false);
  });

  it('SEQ/REO — answered when at least one item is placed', () => {
    expect(isAnswered({ order: ['a'] })).toBe(true);
    expect(isAnswered({ order: [] })).toBe(false);
  });
});
