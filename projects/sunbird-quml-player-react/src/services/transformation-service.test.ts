import { describe, it, expect } from 'vitest';
import { transformQuestion } from './transformation-service';

const raw = (extra: Record<string, unknown> = {}) => ({
  identifier: 'q1',
  primaryCategory: 'multiple choice question',
  body: '<p>Q</p>',
  interactions: { response1: { options: [] } },
  responseDeclaration: { response1: { cardinality: 'single', type: 'integer' } },
  ...extra,
});

describe('transformQuestion — shuffleOptions', () => {
  it('defaults to shuffle when the flag is absent', () => {
    expect(transformQuestion(raw())?.shuffleOptions).toBe(true);
  });

  it('preserves authored order only when explicitly false', () => {
    expect(transformQuestion(raw({ shuffleOptions: false }))?.shuffleOptions).toBe(false);
  });

  it('honors an explicit true', () => {
    expect(transformQuestion(raw({ shuffleOptions: true }))?.shuffleOptions).toBe(true);
  });
});
